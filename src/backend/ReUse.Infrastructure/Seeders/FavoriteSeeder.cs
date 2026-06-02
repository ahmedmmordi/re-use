using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class FavoriteSeeder
{
    private record SeedFavorite(string UserEmail, string ProductTitle);

    private const string AhmedMordiEmail = "ahmed.mordi@reuse.dev";
    private const string AhmedMohamedEmail = "ahmed.mohamed@reuse.dev";
    private const string FarahEmail = "farah.hazem@reuse.dev";
    private const string TasabeihEmail = "tasabeih.talaat@reuse.dev";
    private const string OmarEmail = "omar.goher@reuse.dev";

    private static readonly SeedFavorite[] Favorites =
    {
        new(AhmedMordiEmail, "Zara Floral Midi Dress - Size M"),
        new(AhmedMordiEmail, "IKEA MALM Desk - White, 140x65 cm"),
        new(AhmedMordiEmail, "Trek FX 3 Hybrid Bicycle - Size L"),
        new(AhmedMordiEmail, "Fujifilm X-T30 Mirrorless with 15-45mm"),

        new(AhmedMohamedEmail, "Bialetti Moka Express 6-Cup"),
        new(AhmedMohamedEmail, "The Alchemist by Paulo Coelho - Paperback"),
        new(AhmedMohamedEmail, "Atomic Habits by James Clear - Hardcover"),
        new(AhmedMohamedEmail, "LEGO Technic Bugatti Chiron 42083"),

        new(FarahEmail, "Mango Knit Sweater Dress - Size S"),
        new(FarahEmail, "Seiko 5 Automatic SNK809"),
        new(FarahEmail, "Adidas Ultraboost 22 - Size 43"),
        new(FarahEmail, "Apple AirPods Pro 2nd Generation"),
        new(FarahEmail, "Sapiens by Yuval Noah Harari - Paperback"),

        new(TasabeihEmail, "Zara Floral Midi Dress - Size M"),
        new(TasabeihEmail, "Atomic Habits by James Clear - Hardcover"),
        new(TasabeihEmail, "Le Creuset Cast Iron Dutch Oven 4.5L"),
        new(TasabeihEmail, "Google Pixel 7 128GB - Obsidian"),

        new(OmarEmail, "iPhone 13 Pro 256GB - Graphite"),
        new(OmarEmail, "PlayStation 5 Disc Edition"),
        new(OmarEmail, "Sony WH-1000XM4 Wireless Headphones"),
        new(OmarEmail, "Mid-Century Wooden Bookshelf"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Favorites.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>()
            .ToDictionaryAsync(u => u.Email, u => u.Id);

        var products = await dbContext.Products
            .Select(p => new { p.Id, p.Title, p.OwnerUserId })
            .ToListAsync();

        var productsByTitle = products.ToDictionary(p => p.Title);

        foreach (var seed in Favorites)
        {
            if (!users.TryGetValue(seed.UserEmail, out var userId) ||
                !productsByTitle.TryGetValue(seed.ProductTitle, out var product) ||
                product.OwnerUserId == userId)
            {
                continue;
            }

            dbContext.Favorites.Add(new Favorite
            {
                UserId = userId,
                ProductId = product.Id,
            });
        }

        await dbContext.SaveChangesAsync();
    }
}