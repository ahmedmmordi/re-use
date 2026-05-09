using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class CategorySeeder
{
    private record SeedCategory(
        string Name,
        string Slug,
        string Description,
        string IconUrl,
        SeedCategory[] Children);

    private static readonly SeedCategory[] Tree =
    {
        new(
            "Electronics",
            "electronics",
            "Phones, laptops, cameras and other consumer electronics.",
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
            new SeedCategory[]
            {
                new("Phones & Accessories", "phones-accessories", "Smartphones, cases, chargers and accessories.",
                    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", Array.Empty<SeedCategory>()),
                new("Laptops & Computers", "laptops-computers", "Laptops, desktops and computer hardware.",
                    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", Array.Empty<SeedCategory>()),
                new("Cameras", "cameras", "DSLR, mirrorless and point-and-shoot cameras.",
                    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400", Array.Empty<SeedCategory>()),
                new("Audio", "audio", "Headphones, speakers and home audio gear.",
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", Array.Empty<SeedCategory>()),
                new("Gaming", "gaming", "Consoles, games and gaming accessories.",
                    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Fashion - Men",
            "fashion-men",
            "Men's clothing, shoes and accessories.",
            "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400",
            new SeedCategory[]
            {
                new("Shirts & T-Shirts", "men-shirts-tshirts", "Casual and formal shirts for men.",
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", Array.Empty<SeedCategory>()),
                new("Pants & Jeans", "men-pants-jeans", "Trousers, jeans and shorts.",
                    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", Array.Empty<SeedCategory>()),
                new("Men's Shoes", "men-shoes", "Sneakers, formal shoes and boots.",
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", Array.Empty<SeedCategory>()),
                new("Watches", "men-watches", "Mechanical, smart and dress watches.",
                    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Fashion - Women",
            "fashion-women",
            "Women's clothing, shoes and accessories.",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400",
            new SeedCategory[]
            {
                new("Dresses", "women-dresses", "Casual, evening and summer dresses.",
                    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", Array.Empty<SeedCategory>()),
                new("Tops & Blouses", "women-tops", "Tops, blouses and shirts.",
                    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400", Array.Empty<SeedCategory>()),
                new("Women's Shoes", "women-shoes", "Heels, flats, sneakers and boots.",
                    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400", Array.Empty<SeedCategory>()),
                new("Bags", "women-bags", "Handbags, totes and clutches.",
                    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", Array.Empty<SeedCategory>()),
                new("Jewelry", "women-jewelry", "Rings, necklaces, earrings and bracelets.",
                    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Home & Garden",
            "home-garden",
            "Furniture, decor and gardening supplies.",
            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400",
            new SeedCategory[]
            {
                new("Furniture", "furniture", "Sofas, tables, chairs and storage.",
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400", Array.Empty<SeedCategory>()),
                new("Kitchen & Dining", "kitchen-dining", "Cookware, tableware and small appliances.",
                    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400", Array.Empty<SeedCategory>()),
                new("Decor", "decor", "Lamps, vases, frames and accents.",
                    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400", Array.Empty<SeedCategory>()),
                new("Garden", "garden", "Plants, pots and outdoor tools.",
                    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Toys & Games",
            "toys-games",
            "Toys, board games and puzzles.",
            "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400",
            new SeedCategory[]
            {
                new("Board Games", "board-games", "Strategy, family and party board games.",
                    "https://images.unsplash.com/photo-1606503153255-59d8b8b1b2bf?w=400", Array.Empty<SeedCategory>()),
                new("Action Figures", "action-figures", "Collectible figures and models.",
                    "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=400", Array.Empty<SeedCategory>()),
                new("LEGO & Building", "lego-building", "LEGO sets and other building toys.",
                    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Books & Media",
            "books-media",
            "Books, music and films.",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
            new SeedCategory[]
            {
                new("Books", "books", "Fiction, non-fiction and textbooks.",
                    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400", Array.Empty<SeedCategory>()),
                new("Vinyl & CDs", "vinyl-cds", "Records, CDs and music memorabilia.",
                    "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400", Array.Empty<SeedCategory>()),
                new("Movies", "movies", "DVDs, Blu-ray and movie collectibles.",
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Sports & Outdoors",
            "sports-outdoors",
            "Sports gear and outdoor equipment.",
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400",
            new SeedCategory[]
            {
                new("Bicycles", "bicycles", "Road, mountain and city bikes.",
                    "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400", Array.Empty<SeedCategory>()),
                new("Fitness Equipment", "fitness-equipment", "Weights, mats and home-gym gear.",
                    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", Array.Empty<SeedCategory>()),
                new("Camping & Hiking", "camping-hiking", "Tents, backpacks and outdoor tools.",
                    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Vehicles",
            "vehicles",
            "Cars, motorcycles and vehicle parts.",
            "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400",
            new SeedCategory[]
            {
                new("Cars", "cars", "Used cars and sedans.",
                    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400", Array.Empty<SeedCategory>()),
                new("Motorcycles", "motorcycles", "Motorcycles and scooters.",
                    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400", Array.Empty<SeedCategory>()),
                new("Auto Parts", "auto-parts", "Spare parts and accessories.",
                    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Baby & Kids",
            "baby-kids",
            "Clothes, toys and gear for babies and children.",
            "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
            new SeedCategory[]
            {
                new("Strollers & Car Seats", "strollers-car-seats", "Strollers, car seats and travel gear.",
                    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=400", Array.Empty<SeedCategory>()),
                new("Kids' Clothing", "kids-clothing", "Clothes for boys and girls.",
                    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400", Array.Empty<SeedCategory>()),
                new("Kids' Toys", "kids-toys", "Educational and play toys.",
                    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Pets",
            "pets",
            "Pet supplies and accessories.",
            "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400",
            new SeedCategory[]
            {
                new("Dog Supplies", "dog-supplies", "Leashes, beds, toys and more for dogs.",
                    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400", Array.Empty<SeedCategory>()),
                new("Cat Supplies", "cat-supplies", "Litter boxes, scratchers and toys for cats.",
                    "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400", Array.Empty<SeedCategory>()),
                new("Aquariums", "aquariums", "Tanks, filters and aquatic accessories.",
                    "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Tools & DIY",
            "tools-diy",
            "Hand tools, power tools and DIY supplies.",
            "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400",
            new SeedCategory[]
            {
                new("Power Tools", "power-tools", "Drills, saws and grinders.",
                    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400", Array.Empty<SeedCategory>()),
                new("Hand Tools", "hand-tools", "Hammers, screwdrivers and wrenches.",
                    "https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?w=400", Array.Empty<SeedCategory>()),
            }),
        new(
            "Beauty & Health",
            "beauty-health",
            "Beauty products and personal-care items.",
            "https://images.unsplash.com/photo-1606570109843-5c1ff8e7cc1a",
            new SeedCategory[]
            {
                new("Skincare", "skincare", "Cleansers, moisturizers and serums.",
                    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400", Array.Empty<SeedCategory>()),
                new("Makeup", "makeup", "Lipstick, foundation and palettes.",
                    "https://images.unsplash.com/photo-1522335789203-aaa54c0bf218?w=400", Array.Empty<SeedCategory>()),
                new("Fragrances", "fragrances", "Perfumes and colognes.",
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400", Array.Empty<SeedCategory>()),
            }),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Categories.AnyAsync())
        {
            return;
        }

        foreach (var top in Tree)
        {
            var parent = new Category
            {
                Name = top.Name,
                Slug = top.Slug,
                Description = top.Description,
                IconUrl = top.IconUrl,
                IsActive = true,
            };

            dbContext.Categories.Add(parent);

            foreach (var child in top.Children)
            {
                dbContext.Categories.Add(new Category
                {
                    Name = child.Name,
                    Slug = child.Slug,
                    Description = child.Description,
                    IconUrl = child.IconUrl,
                    IsActive = true,
                    ParentId = parent.Id,
                });
            }
        }

        await dbContext.SaveChangesAsync();
    }
}