using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class FeedbackSeeder
{
    private static readonly string[] PositiveComments =
    {
        "Great seller, item exactly as described. Smooth and fast deal.",
        "Item in perfect condition, friendly communication. Highly recommend.",
        "Quick response and easy pickup. Would buy again.",
        "Honest description, no surprises. Very happy with the purchase.",
        "Excellent experience, packaging was careful and delivery on time.",
    };

    private static readonly string[] NeutralComments =
    {
        "Item was fine overall, communication a bit slow but deal went through.",
        "Product as described, took a while to arrange the meetup.",
        "Decent deal, minor wear not fully mentioned but acceptable.",
    };

    private static readonly string[] NegativeComments =
    {
        "Item had more wear than described. Took long to respond.",
        "Not quite as expected, but seller was polite about it.",
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Feedbacks.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>().ToListAsync();
        var userIds = users.Select(u => u.Id).ToList();

        var products = await dbContext.Products
            .Select(p => new { p.Id, p.OwnerUserId })
            .ToListAsync();

        if (products.Count == 0 || userIds.Count < 2)
        {
            return;
        }

        var random = new Random(77);
        var now = DateTime.UtcNow;

        var feedbacks = new List<Feedback>();
        var aggregates = new Dictionary<Guid, (int sum, int count)>();

        // Roughly 40% of products receive feedback from a non-owner.
        foreach (var product in products)
        {
            if (random.Next(100) >= 40)
            {
                continue;
            }

            var raterIds = userIds.Where(id => id != product.OwnerUserId).ToList();
            if (raterIds.Count == 0)
            {
                continue;
            }

            var raterId = raterIds[random.Next(raterIds.Count)];

            // Skew towards positive ratings while keeping a realistic spread.
            var roll = random.Next(100);
            var stars = roll < 60 ? 5
                : roll < 80 ? 4
                : roll < 90 ? 3
                : roll < 96 ? 2
                : 1;

            var comment = stars >= 4 ? PositiveComments[random.Next(PositiveComments.Length)]
                : stars == 3 ? NeutralComments[random.Next(NeutralComments.Length)]
                : NegativeComments[random.Next(NegativeComments.Length)];

            // Spread from minutes ago to ~1.5 years old.
            var minutesAgo = random.Next(0, 788400);
            var createdAt = now.AddMinutes(-minutesAgo);

            // A small share moderated (soft-deleted) and excluded from aggregates.
            var isDeleted = random.Next(100) < 8;

            feedbacks.Add(new Feedback
            {
                ProductId = product.Id,
                RaterUserId = raterId,
                RateeUserId = product.OwnerUserId,
                Stars = stars,
                Comment = comment,
                IsDeleted = isDeleted,
                DeletedAt = isDeleted ? createdAt.AddDays(random.Next(1, 20)) : null,
                CreatedAt = createdAt,
            });

            if (!isDeleted)
            {
                aggregates.TryGetValue(product.OwnerUserId, out var agg);
                aggregates[product.OwnerUserId] = (agg.sum + stars, agg.count + 1);
            }
        }

        dbContext.Feedbacks.AddRange(feedbacks);

        foreach (var user in users)
        {
            if (aggregates.TryGetValue(user.Id, out var agg) && agg.count > 0)
            {
                user.RatingsCount = agg.count;
                user.RatingsAverage = Math.Round((decimal)agg.sum / agg.count, 2);
            }
        }

        await dbContext.SaveChangesAsync();
    }
}