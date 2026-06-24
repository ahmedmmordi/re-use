using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class ConversationSeeder
{
    private static readonly string[] BuyerOpeners =
    {
        "Hi, is this still available?",
        "Hello, interested in this. Is the price negotiable?",
        "Hi, can you share more photos please?",
        "Is this still for sale? Where can we meet?",
        "Hello, what's the lowest you can do?",
    };

    private static readonly string[] SellerReplies =
    {
        "Yes, it's still available.",
        "Sure, I can do a small discount for a quick pickup.",
        "Of course, I'll send a few more photos shortly.",
        "It's available, we can meet downtown if that works.",
        "The price is slightly flexible for serious buyers.",
    };

    private static readonly string[] BuyerFollowUps =
    {
        "Great, when are you free to meet?",
        "Sounds good, I'll take it.",
        "Thanks, let me think and get back to you.",
        "Perfect, can we do this weekend?",
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Conversations.AnyAsync())
        {
            return;
        }

        var userIds = await dbContext.Set<User>().Select(u => u.Id).ToListAsync();

        var products = await dbContext.Products
            .Select(p => new { p.Id, p.OwnerUserId })
            .ToListAsync();

        if (products.Count == 0 || userIds.Count < 2)
        {
            return;
        }

        var random = new Random(91);
        var now = DateTime.UtcNow;

        var statuses = (ConversationStatus[])Enum.GetValues(typeof(ConversationStatus));

        // Open a conversation on roughly a third of products.
        foreach (var product in products)
        {
            if (random.Next(100) >= 33)
            {
                continue;
            }

            var reactantCandidates = userIds.Where(id => id != product.OwnerUserId).ToList();
            if (reactantCandidates.Count == 0)
            {
                continue;
            }

            var reactantId = reactantCandidates[random.Next(reactantCandidates.Count)];

            var startMinutesAgo = random.Next(60, 525600);
            var startedAt = now.AddMinutes(-startMinutesAgo);

            var status = statuses[random.Next(statuses.Length)];

            var messages = new List<Message>();
            var cursor = startedAt;

            void AddMessage(Guid senderId, string content)
            {
                cursor = cursor.AddMinutes(random.Next(2, 240));
                var delivered = cursor.AddSeconds(random.Next(1, 120));
                var isRead = random.Next(100) < 75;

                messages.Add(new Message
                {
                    SenderId = senderId,
                    MessageType = MessageType.Text,
                    Content = content,
                    SentAt = cursor,
                    DeliveredAt = delivered,
                    ReadAt = isRead ? delivered.AddSeconds(random.Next(5, 600)) : null,
                    CreatedAt = cursor,
                });
            }

            AddMessage(reactantId, BuyerOpeners[random.Next(BuyerOpeners.Length)]);
            AddMessage(product.OwnerUserId, SellerReplies[random.Next(SellerReplies.Length)]);

            if (random.Next(100) < 70)
            {
                AddMessage(reactantId, BuyerFollowUps[random.Next(BuyerFollowUps.Length)]);
            }

            // Occasional media message (e.g. a photo the seller shares).
            if (random.Next(100) < 25)
            {
                cursor = cursor.AddMinutes(random.Next(2, 120));
                messages.Add(new Message
                {
                    SenderId = product.OwnerUserId,
                    MessageType = MessageType.Media,
                    MediaUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
                    SentAt = cursor,
                    DeliveredAt = cursor.AddSeconds(random.Next(1, 60)),
                    ReadAt = random.Next(100) < 60 ? cursor.AddMinutes(random.Next(1, 30)) : null,
                    CreatedAt = cursor,
                });
            }

            var lastActivity = messages[^1].SentAt;

            var conversation = new Conversation
            {
                ProductId = product.Id,
                ReactantId = reactantId,
                OwnerId = product.OwnerUserId,
                Status = status,
                IsActive = status == ConversationStatus.Active,
                LastActivityAt = lastActivity,
                CreatedAt = startedAt,
                Messages = messages,
            };

            dbContext.Conversations.Add(conversation);
        }

        await dbContext.SaveChangesAsync();
    }
}