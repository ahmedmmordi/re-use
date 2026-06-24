using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class SystemActivityLogSeeder
{
    private record Template(
        LogActionType ActionType,
        LogCategory Category,
        LogSeverity Severity,
        LogStatus Status,
        string Description,
        string? EntityType);

    private static readonly Template[] Templates =
    {
        new(LogActionType.Login, LogCategory.Authentication, LogSeverity.Info, LogStatus.Success, "User logged in successfully.", "User"),
        new(LogActionType.LoginFailed, LogCategory.Authentication, LogSeverity.Warning, LogStatus.Failure, "Failed login attempt with invalid credentials.", "User"),
        new(LogActionType.Logout, LogCategory.Authentication, LogSeverity.Info, LogStatus.Success, "User logged out.", "User"),
        new(LogActionType.PasswordChanged, LogCategory.Authentication, LogSeverity.Info, LogStatus.Success, "User changed their password.", "User"),
        new(LogActionType.UserCreated, LogCategory.UserManagement, LogSeverity.Info, LogStatus.Success, "New user account created.", "User"),
        new(LogActionType.UserDeactivated, LogCategory.UserManagement, LogSeverity.Warning, LogStatus.Success, "User account deactivated by admin.", "User"),
        new(LogActionType.RoleAssigned, LogCategory.UserManagement, LogSeverity.Info, LogStatus.Success, "Role assigned to user.", "User"),
        new(LogActionType.ProductApproved, LogCategory.ContentModeration, LogSeverity.Info, LogStatus.Success, "Product approved by moderator.", "Product"),
        new(LogActionType.ProductRejected, LogCategory.ContentModeration, LogSeverity.Warning, LogStatus.Success, "Product rejected during moderation.", "Product"),
        new(LogActionType.CommentDeleted, LogCategory.ContentModeration, LogSeverity.Warning, LogStatus.Success, "Comment removed by moderator.", "ProductComment"),
        new(LogActionType.PremiumGranted, LogCategory.ProductManagement, LogSeverity.Info, LogStatus.Success, "Premium status granted to product.", "Product"),
        new(LogActionType.ReportCreated, LogCategory.ContentModeration, LogSeverity.Info, LogStatus.Success, "New report submitted.", "Report"),
        new(LogActionType.ReportReviewed, LogCategory.ContentModeration, LogSeverity.Info, LogStatus.Success, "Report reviewed and closed.", "Report"),
        new(LogActionType.PaymentSuccess, LogCategory.PaymentManagement, LogSeverity.Info, LogStatus.Success, "Payment processed successfully.", "Payment"),
        new(LogActionType.PaymentFailed, LogCategory.PaymentManagement, LogSeverity.Error, LogStatus.Failure, "Payment failed at the provider.", "Payment"),
        new(LogActionType.UnauthorizedAccess, LogCategory.Security, LogSeverity.Critical, LogStatus.Failure, "Unauthorized access attempt detected.", null),
        new(LogActionType.PermissionDenied, LogCategory.Security, LogSeverity.Warning, LogStatus.Failure, "Permission denied for the requested action.", null),
        new(LogActionType.SettingUpdated, LogCategory.SystemConfiguration, LogSeverity.Info, LogStatus.Success, "System setting updated.", null),
        new(LogActionType.UnhandledException, LogCategory.General, LogSeverity.Error, LogStatus.Failure, "An unhandled exception occurred.", null),
        new(LogActionType.InfrastructureFailure, LogCategory.General, LogSeverity.Critical, LogStatus.Failure, "Infrastructure component reported a failure.", null),
    };

    private static readonly string[] IpAddresses =
    {
        "197.45.12.8", "156.213.44.10", "41.232.5.99", "102.40.78.3", "156.200.1.21",
    };

    private static readonly string[] UserAgents =
    {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148",
        "Mozilla/5.0 (Linux; Android 13) Chrome/119.0 Mobile Safari/537.36",
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.SystemActivityLogs.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>()
            .Select(u => new { u.Id, u.Email, u.FullName })
            .ToListAsync();

        if (users.Count == 0)
        {
            return;
        }

        var random = new Random(202);
        var now = DateTime.UtcNow;

        var logs = new List<SystemActivityLog>();

        for (var i = 0; i < 120; i++)
        {
            var template = Templates[random.Next(Templates.Length)];

            // System-level entries (infrastructure/security) sometimes have no actor.
            var isSystem = template.EntityType == null && random.Next(100) < 40;
            var actor = isSystem ? null : users[random.Next(users.Count)];

            var minutesAgo = random.Next(0, 525600);
            var createdAt = now.AddMinutes(-minutesAgo);

            logs.Add(new SystemActivityLog
            {
                ActorUserId = actor?.Id,
                ActorName = actor?.FullName,
                ActorEmail = actor?.Email,
                ActionType = template.ActionType,
                Category = template.Category,
                Severity = template.Severity,
                Status = template.Status,
                EntityType = template.EntityType,
                EntityId = template.EntityType == null ? null : Guid.NewGuid().ToString(),
                Description = template.Description,
                IpAddress = isSystem ? null : IpAddresses[random.Next(IpAddresses.Length)],
                UserAgent = isSystem ? null : UserAgents[random.Next(UserAgents.Length)],
                CreatedAt = createdAt,
            });
        }

        dbContext.SystemActivityLogs.AddRange(logs);
        await dbContext.SaveChangesAsync();
    }
}