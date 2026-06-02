using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class CategoryFollowSeeder
{
    private record SeedCategoryFollow(string UserEmail, string CategorySlug);

    private const string AhmedMordiEmail = "ahmed.mordi@reuse.dev";
    private const string AhmedMohamedEmail = "ahmed.mohamed@reuse.dev";
    private const string FarahEmail = "farah.hazem@reuse.dev";
    private const string TasabeihEmail = "tasabeih.talaat@reuse.dev";
    private const string OmarEmail = "omar.goher@reuse.dev";

    private static readonly SeedCategoryFollow[] CategoryFollows =
    {
        new(AhmedMordiEmail, "electronics"),
        new(AhmedMordiEmail, "gaming"),
        new(AhmedMordiEmail, "audio"),

        new(AhmedMohamedEmail, "tools-diy"),
        new(AhmedMohamedEmail, "home-garden"),
        new(AhmedMohamedEmail, "bicycles"),

        new(FarahEmail, "fashion-women"),
        new(FarahEmail, "women-bags"),
        new(FarahEmail, "women-shoes"),

        new(TasabeihEmail, "fashion-women"),
        new(TasabeihEmail, "books"),
        new(TasabeihEmail, "home-garden"),

        new(OmarEmail, "electronics"),
        new(OmarEmail, "gaming"),
        new(OmarEmail, "audio"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.CategoryFollows.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>()
            .ToDictionaryAsync(u => u.Email, u => u.Id);

        var categories = await dbContext.Categories
            .ToDictionaryAsync(c => c.Slug, c => c.Id);

        foreach (var seed in CategoryFollows)
        {
            if (!users.TryGetValue(seed.UserEmail, out var userId) ||
                !categories.TryGetValue(seed.CategorySlug, out var categoryId))
            {
                continue;
            }

            dbContext.CategoryFollows.Add(new CategoryFollow
            {
                UserId = userId,
                CategoryId = categoryId,
            });
        }

        await dbContext.SaveChangesAsync();
    }
}