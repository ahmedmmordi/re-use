using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class ProductDealSeeder
{
    private static readonly string[] Notes =
    {
        "Agreed on a meetup downtown for the handover.",
        "Buyer requested a small discount, seller agreed.",
        "Swap arranged, both items in similar condition.",
        "Deal confirmed over chat, pickup this week.",
        "Negotiated price after inspecting photos.",
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.ProductDeals.AnyAsync())
        {
            return;
        }

        var conversations = await dbContext.Conversations
            .Select(c => new { c.Id, c.ProductId, c.OwnerId, c.ReactantId, c.LastActivityAt })
            .ToListAsync();

        if (conversations.Count == 0)
        {
            return;
        }

        var prices = await dbContext.Products
            .OfType<RegularProduct>()
            .Select(p => new { p.Id, p.Price })
            .ToDictionaryAsync(p => p.Id, p => p.Price);

        var random = new Random(55);
        var now = DateTime.UtcNow;
        var dealTypes = (DealType[])Enum.GetValues(typeof(DealType));

        // A deal emerges from roughly half of the conversations.
        foreach (var conv in conversations)
        {
            if (random.Next(100) >= 50)
            {
                continue;
            }

            var dealType = dealTypes[random.Next(dealTypes.Length)];

            decimal? agreedPrice = null;
            if (dealType != DealType.Swap && prices.TryGetValue(conv.ProductId, out var basePrice))
            {
                // Negotiated deals settle a bit below the listed price.
                var discount = dealType == DealType.NegotiatedPurchase ? random.Next(5, 30) : 0;
                agreedPrice = Math.Max(5m, basePrice - discount);
            }

            var sellerConfirmed = random.Next(100) < 80;
            var buyerConfirmed = random.Next(100) < 80;
            var completed = sellerConfirmed && buyerConfirmed && random.Next(100) < 70;

            var createdAt = conv.LastActivityAt.AddMinutes(random.Next(5, 1440));
            if (createdAt > now)
            {
                createdAt = now.AddMinutes(-random.Next(1, 60));
            }

            var deal = new ProductDeal
            {
                ProductId = conv.ProductId,
                ConversationId = conv.Id,
                SellerId = conv.OwnerId,
                BuyerId = conv.ReactantId,
                DealType = dealType,
                AgreedPrice = agreedPrice,
                Notes = Notes[random.Next(Notes.Length)],
                SellerConfirmed = sellerConfirmed,
                BuyerConfirmed = buyerConfirmed,
                CompletedAt = completed ? createdAt.AddHours(random.Next(1, 72)) : null,
                CreatedAt = createdAt,
            };

            dbContext.ProductDeals.Add(deal);
        }

        await dbContext.SaveChangesAsync();
    }
}