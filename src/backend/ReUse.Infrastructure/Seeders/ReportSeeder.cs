using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class ReportSeeder
{
    private static readonly string[] Notes =
    {
        "This listing looks like a scam, the price is too good to be true.",
        "Duplicate spam posting, seen the same item multiple times.",
        "The description does not match the photos.",
        "Offensive language used in the comment.",
        "User keeps sending unsolicited messages.",
        "Product seems counterfeit or misleading.",
    };

    private static readonly string[] ReviewNotes =
    {
        "Reviewed and confirmed, action taken.",
        "Checked the report, no violation found.",
        "Warned the user and kept the listing.",
        "Removed the offending content.",
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var config = services.GetRequiredService<IConfiguration>();

        if (await dbContext.Reports.AnyAsync())
        {
            return;
        }

        var productIds = await dbContext.Products.Select(p => p.Id).ToListAsync();
        var commentIds = await dbContext.ProductComments.Select(c => c.Id).ToListAsync();

        var users = await dbContext.Set<User>()
            .Select(u => new { u.Id, u.Email, u.FullName })
            .ToListAsync();

        if (users.Count == 0)
        {
            return;
        }

        var userIds = users.Select(u => u.Id).ToList();

        var adminEmail = config["ADMIN:EMAIL"];
        Guid? adminId = users.FirstOrDefault(u => u.Email == adminEmail)?.Id;

        var random = new Random(88);
        var now = DateTime.UtcNow;

        var reasons = (ReportReason[])Enum.GetValues(typeof(ReportReason));
        var statuses = (ReportStatus[])Enum.GetValues(typeof(ReportStatus));

        var reports = new List<Report>();

        void AddReports(ReportTargetType targetType, List<Guid> targetIds, int count)
        {
            if (targetIds.Count == 0)
            {
                return;
            }

            for (var i = 0; i < count; i++)
            {
                var targetId = targetIds[random.Next(targetIds.Count)];
                var reporterId = userIds[random.Next(userIds.Count)];
                var status = statuses[random.Next(statuses.Length)];

                var minutesAgo = random.Next(0, 525600);
                var createdAt = now.AddMinutes(-minutesAgo);

                var reviewed = status is ReportStatus.Resolved or ReportStatus.Dismissed or ReportStatus.UnderReview;

                // A minority of reports are anonymous (no logged-in reporter).
                var anonymous = random.Next(100) < 20;

                reports.Add(new Report
                {
                    ReporterUserId = anonymous ? null : reporterId,
                    ReporterName = anonymous ? "Guest" : null,
                    ReporterEmail = anonymous ? "guest@example.com" : null,
                    TargetType = targetType,
                    TargetId = targetId,
                    Reason = reasons[random.Next(reasons.Length)],
                    Notes = Notes[random.Next(Notes.Length)],
                    Status = status,
                    ReviewedByUserId = reviewed ? adminId : null,
                    ReviewedAt = reviewed ? createdAt.AddHours(random.Next(1, 240)) : null,
                    ReviewNotes = reviewed ? ReviewNotes[random.Next(ReviewNotes.Length)] : null,
                    CreatedAt = createdAt,
                });
            }
        }

        AddReports(ReportTargetType.Product, productIds, 15);
        AddReports(ReportTargetType.Comment, commentIds, 8);
        AddReports(ReportTargetType.User, userIds, 6);

        dbContext.Reports.AddRange(reports);
        await dbContext.SaveChangesAsync();
    }
}