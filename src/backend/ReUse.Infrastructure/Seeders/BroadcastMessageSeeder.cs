using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class BroadcastMessageSeeder
{
    private record Template(string Title, string Body, BroadcastAudience Audience);

    private static readonly Template[] Templates =
    {
        new("Welcome to ReUse", "Thanks for joining ReUse. Start listing items you no longer need and give them a second life.", BroadcastAudience.All),
        new("Scheduled maintenance", "The platform will undergo maintenance this weekend. Some features may be briefly unavailable.", BroadcastAudience.All),
        new("New swap feature", "You can now propose swaps directly from a product page. Try it out today.", BroadcastAudience.Users),
        new("Holiday season deals", "More buyers are browsing this season. Make sure your listings have clear photos and titles.", BroadcastAudience.Users),
        new("Updated community guidelines", "We have refreshed our community guidelines. Please review them to keep the marketplace safe.", BroadcastAudience.All),
        new("Admin report queue reminder", "There are pending reports awaiting review. Please clear the moderation queue.", BroadcastAudience.Admins),
        new("Premium listings now available", "Boost your products with premium placement for more visibility.", BroadcastAudience.Users),
        new("Security advisory", "Never share your password. Our team will never ask for it.", BroadcastAudience.All),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var config = services.GetRequiredService<IConfiguration>();

        if (await dbContext.BroadcastMessages.AnyAsync())
        {
            return;
        }

        var adminEmail = config["ADMIN:EMAIL"];
        var admin = await dbContext.Set<User>()
            .Where(u => u.Email == adminEmail)
            .Select(u => new { u.Id })
            .FirstOrDefaultAsync();

        if (admin == null)
        {
            return;
        }

        var random = new Random(101);
        var now = DateTime.UtcNow;
        var totalUsers = await dbContext.Set<User>().CountAsync();

        var messages = new List<BroadcastMessage>();
        var index = 0;

        foreach (var template in Templates)
        {
            // Spread the four lifecycle states across the templates.
            var statusRoll = index % 5;
            var status = statusRoll switch
            {
                0 => BroadcastStatus.Sent,
                1 => BroadcastStatus.Sent,
                2 => BroadcastStatus.Scheduled,
                3 => BroadcastStatus.Draft,
                _ => BroadcastStatus.Failed,
            };

            // Timestamps spread from a few minutes ago to several months old.
            var minutesAgo = random.Next(60, 262800);
            var createdAt = now.AddMinutes(-minutesAgo);

            var recipientCount = status is BroadcastStatus.Sent or BroadcastStatus.Failed
                ? Math.Max(1, totalUsers)
                : 0;

            DateTime? scheduledAt = null;
            DateTime? sentAt = null;
            var delivered = 0;
            var failed = 0;

            switch (status)
            {
                case BroadcastStatus.Sent:
                    sentAt = createdAt.AddMinutes(random.Next(1, 120));
                    failed = random.Next(0, Math.Max(1, recipientCount / 10));
                    delivered = recipientCount - failed;
                    break;
                case BroadcastStatus.Scheduled:
                    scheduledAt = now.AddDays(random.Next(1, 14));
                    break;
                case BroadcastStatus.Failed:
                    sentAt = createdAt.AddMinutes(random.Next(1, 120));
                    failed = recipientCount;
                    break;
                case BroadcastStatus.Draft:
                default:
                    break;
            }

            messages.Add(new BroadcastMessage
            {
                Title = template.Title,
                Body = template.Body,
                TargetAudience = template.Audience,
                Status = status,
                ScheduledAt = scheduledAt,
                SentAt = sentAt,
                RecipientCount = recipientCount,
                DeliveredCount = delivered,
                FailedCount = failed,
                CreatedByUserId = admin.Id,
                CreatedAt = createdAt,
            });

            index++;
        }

        dbContext.BroadcastMessages.AddRange(messages);
        await dbContext.SaveChangesAsync();
    }
}