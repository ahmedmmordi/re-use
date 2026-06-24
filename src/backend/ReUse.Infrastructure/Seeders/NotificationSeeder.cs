using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class NotificationSeeder
{
    private record Template(NotificationType Type, string Title, string Body);

    private static readonly Template[] Templates =
    {
        new(NotificationType.FollowActivity, "New follower", "Someone started following you."),
        new(NotificationType.CategoryUpdate, "New item in a category you follow", "A new product was posted in one of your followed categories."),
        new(NotificationType.NewMessage, "New message", "You have a new message about one of your products."),
        new(NotificationType.WantedMatch, "Wanted match found", "A product matching your wanted listing was posted."),
        new(NotificationType.SwapMatch, "Swap match found", "A possible swap match for your item was found."),
        new(NotificationType.AdminBroadcast, "Announcement", "Check out the latest platform announcement."),
        new(NotificationType.OrderUpdate, "Order update", "The status of your order has changed."),
        new(NotificationType.CommentReply, "New reply", "Someone replied to your comment."),
        new(NotificationType.FeedbackReceived, "New feedback", "You received new feedback on a completed deal."),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        var users = await dbContext.Set<User>().Select(u => u.Id).ToListAsync();
        if (users.Count == 0)
        {
            return;
        }

        var random = new Random(63);
        var now = DateTime.UtcNow;

        await SeedSettingsAsync(dbContext, users, random);
        await SeedNotificationsAsync(dbContext, users, random, now);
    }

    private static async Task SeedSettingsAsync(ApplicationDbContext dbContext, List<Guid> users, Random random)
    {
        if (await dbContext.UserNotificationSettings.AnyAsync())
        {
            return;
        }

        var types = (NotificationType[])Enum.GetValues(typeof(NotificationType));

        // Only the in-app channel has a delivery handler, so settings cover that channel.
        foreach (var userId in users)
        {
            foreach (var type in types)
            {
                // Most notification types enabled; a subset muted per user.
                var isEnabled = random.Next(100) < 80;

                // A subset of users define quiet hours.
                TimeOnly? quietStart = null;
                TimeOnly? quietEnd = null;
                if (random.Next(100) < 30)
                {
                    quietStart = new TimeOnly(22, 0);
                    quietEnd = new TimeOnly(7, 0);
                }

                dbContext.UserNotificationSettings.Add(new UserNotificationSetting
                {
                    UserId = userId,
                    NotificationType = type,
                    Channel = NotificationChannel.InApp,
                    IsEnabled = isEnabled,
                    QuietHoursStart = quietStart,
                    QuietHoursEnd = quietEnd,
                });
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedNotificationsAsync(ApplicationDbContext dbContext, List<Guid> users, Random random, DateTime now)
    {
        if (await dbContext.Notifications.AnyAsync())
        {
            return;
        }

        foreach (var userId in users)
        {
            var count = random.Next(8, 25);
            for (var i = 0; i < count; i++)
            {
                var template = Templates[random.Next(Templates.Length)];

                var minutesAgo = random.Next(0, 525600);
                var createdAt = now.AddMinutes(-minutesAgo);

                var isRead = random.Next(100) < 55;
                var isSeen = isRead || random.Next(100) < 70;

                var notification = new Notification
                {
                    UserId = userId,
                    Title = template.Title,
                    Body = template.Body,
                    Type = template.Type,
                    IsRead = isRead,
                    ReadAt = isRead ? createdAt.AddMinutes(random.Next(1, 600)) : null,
                    SeenAt = isSeen ? createdAt.AddMinutes(random.Next(1, 300)) : null,
                    CreatedAt = createdAt,
                    Deliveries = new List<NotificationDelivery> { BuildInAppDelivery(createdAt, random) },
                };

                dbContext.Notifications.Add(notification);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    // Mirrors the in-app SignalR handler: a single in-app delivery, mostly Sent, occasionally Failed.
    private static NotificationDelivery BuildInAppDelivery(DateTime createdAt, Random random)
    {
        var failed = random.Next(100) < 10;

        return new NotificationDelivery
        {
            Channel = NotificationChannel.InApp,
            Status = failed ? DeliveryStatus.Failed : DeliveryStatus.Sent,
            SentAt = failed ? null : createdAt.AddSeconds(random.Next(1, 300)),
            FailedAt = failed ? createdAt.AddSeconds(random.Next(1, 300)) : null,
            ErrorMessage = failed ? "Failed to deliver in-app notification." : null,
            RetryCount = failed ? random.Next(1, 4) : 0,
            CreatedAt = createdAt,
        };
    }
}