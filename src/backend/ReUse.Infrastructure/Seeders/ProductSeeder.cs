using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class ProductSeeder
{
    private record SeedImage(string Url);

    private record SeedProductBase(
        string CategorySlug,
        string OwnerEmail,
        string Title,
        string Description,
        ProductCondition Condition,
        string City,
        string Country,
        SeedImage[] Images);

    private record SeedRegular(SeedProductBase Base, decimal Price, bool AllowNegotiation);
    private record SeedSwap(SeedProductBase Base, string WantedTitle, string? WantedDescription, ProductCondition? WantedCondition);
    private record SeedWanted(SeedProductBase Base, decimal? PriceMin, decimal? PriceMax);

    private const string AhmedEmail = "ahmed.hassan@reuse.dev";
    private const string SarahEmail = "sarah.mahmoud@reuse.dev";
    private const string OmarEmail = "omar.khaled@reuse.dev";

    private static readonly SeedRegular[] RegularProducts =
    {
        new(new SeedProductBase(
            "phones-accessories", AhmedEmail,
            "iPhone 13 Pro 256GB - Graphite",
            "Apple iPhone 13 Pro, 256GB, Graphite. Battery health 92%. Includes original box and cable. No scratches on screen, minor wear on the frame.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800"),
            }),
            899m, true),
        new(new SeedProductBase(
            "laptops-computers", AhmedEmail,
            "MacBook Pro 14\" M1 Pro 16GB / 512GB",
            "2021 MacBook Pro with M1 Pro chip, 16GB unified memory, 512GB SSD. Used for development. Excellent condition, comes with original 67W charger.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"),
            }),
            1450m, false),
        new(new SeedProductBase(
            "audio", AhmedEmail,
            "Sony WH-1000XM4 Wireless Headphones",
            "Industry-leading noise-cancelling headphones. Black. Includes carrying case, 3.5mm cable and USB-C charging cable.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1545127398-14699f92334b?w=800"),
            }),
            220m, true),
        new(new SeedProductBase(
            "cameras", AhmedEmail,
            "Canon EOS 90D DSLR Body",
            "Canon EOS 90D body only. ~12k shutter count. Comes with battery, charger and original strap. No lens included.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800"),
            }),
            780m, true),
        new(new SeedProductBase(
            "gaming", AhmedEmail,
            "PlayStation 5 Disc Edition",
            "PS5 console with one DualSense controller. All cables included. Light usage, kept in a smoke-free home.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800"),
            }),
            520m, false),

        new(new SeedProductBase(
            "women-dresses", SarahEmail,
            "Zara Floral Midi Dress - Size M",
            "Floral print midi dress from Zara, size M. Worn twice. Perfect for spring and summer occasions.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"),
            }),
            45m, true),
        new(new SeedProductBase(
            "women-bags", SarahEmail,
            "Michael Kors Leather Tote Bag",
            "Michael Kors saffiano leather tote in tan. Light scratches inside. Authentic, comes with dust bag.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"),
            }),
            180m, true),
        new(new SeedProductBase(
            "women-shoes", SarahEmail,
            "Nike Air Force 1 - Women's Size 38",
            "Classic white Nike Air Force 1, women's EU 38. Worn a few times, original box included.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"),
            }),
            85m, false),
        new(new SeedProductBase(
            "women-jewelry", SarahEmail,
            "Pandora Sterling Silver Charm Bracelet",
            "Authentic Pandora sterling silver bracelet with 5 charms. Comes with original pouch and certificate.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"),
            }),
            120m, true),
        new(new SeedProductBase(
            "women-tops", SarahEmail,
            "H&M Linen Blouse - Size S",
            "White linen blouse from H&M, size S. Brand new with tags.",
            ProductCondition.New, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800"),
            }),
            22m, false),

        new(new SeedProductBase(
            "furniture", OmarEmail,
            "IKEA MALM Desk - White, 140x65 cm",
            "IKEA MALM desk in white, 140x65 cm. Lightly used, no major scratches. Disassembled for easy transport.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"),
            }),
            95m, true),
        new(new SeedProductBase(
            "power-tools", OmarEmail,
            "Bosch GSB 13 RE Impact Drill",
            "Bosch GSB 13 RE 600W impact drill. Used on a couple of home projects. Comes with carrying case and bits.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800"),
            }),
            65m, true),
        new(new SeedProductBase(
            "hand-tools", OmarEmail,
            "Stanley 65-piece Tool Kit",
            "Complete Stanley 65-piece home tool set. Used a few times. All pieces present, original case.",
            ProductCondition.LikeNew, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://plus.unsplash.com/premium_photo-1683140705462-11ed388653cf"),
            }),
            55m, false),
        new(new SeedProductBase(
            "decor", OmarEmail,
            "Vintage Brass Table Lamp",
            "Vintage brass table lamp, fully working. Adds a warm tone to any room. Bulb included.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"),
            }),
            40m, true),
        new(new SeedProductBase(
            "kitchen-dining", OmarEmail,
            "Le Creuset Cast Iron Dutch Oven 4.5L",
            "Le Creuset enameled cast iron Dutch oven, 4.5L, cherry red. Light surface wear, fully functional.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"),
            }),
            150m, true),

        new(new SeedProductBase(
            "men-shoes", AhmedEmail,
            "Adidas Ultraboost 22 - Size 43",
            "Adidas Ultraboost 22 running shoes, EU 43. Used for casual wear, lots of life left.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"),
            }),
            70m, true),
        new(new SeedProductBase(
            "men-watches", AhmedEmail,
            "Seiko 5 Automatic SNK809",
            "Seiko 5 automatic men's watch, black dial. Keeps great time. Original strap included.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800"),
            }),
            95m, false),
        new(new SeedProductBase(
            "books", SarahEmail,
            "Atomic Habits by James Clear - Hardcover",
            "Atomic Habits by James Clear, hardcover edition. Read once, like-new condition.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800"),
            }),
            14m, false),
        new(new SeedProductBase(
            "bicycles", OmarEmail,
            "Trek FX 3 Hybrid Bicycle - Size L",
            "Trek FX 3 hybrid bike, size L (56 cm). Great for city commuting. Recently serviced.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800"),
            }),
            420m, true),
        new(new SeedProductBase(
            "lego-building", AhmedEmail,
            "LEGO Star Wars Millennium Falcon 75257",
            "LEGO Star Wars Millennium Falcon set 75257. Built once, all pieces and instructions included.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"),
            }),
            130m, true),
    };

    private static readonly SeedSwap[] SwapProducts =
    {
        new(new SeedProductBase(
            "gaming", AhmedEmail,
            "Xbox Series S - Swap for Nintendo Switch OLED",
            "Xbox Series S in mint condition with one controller. Looking to swap for a Nintendo Switch OLED in similar condition.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800"),
            }),
            "Nintendo Switch OLED", "White or neon edition preferred.", ProductCondition.LikeNew),
        new(new SeedProductBase(
            "women-bags", SarahEmail,
            "Coach Crossbody Bag - Swap for Designer Wallet",
            "Coach leather crossbody bag, brown. Looking to swap for a designer wallet (Coach, Michael Kors, Kate Spade).",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"),
            }),
            "Designer Wallet", "Any condition or brand is welcome.", ProductCondition.LikeNew),
        new(new SeedProductBase(
            "bicycles", OmarEmail,
            "Mountain Bike - Swap for Road Bike",
            "Hardtail mountain bike, size M. Open to swapping for a road bike of similar value.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800"),
            }),
            "Road Bike", "Aluminum or carbon frame, size M or L.", ProductCondition.Used),
    };

    private static readonly SeedWanted[] WantedProducts =
    {
        new(new SeedProductBase(
            "phones-accessories", SarahEmail,
            "Looking for: iPhone 14 or 15",
            "Looking to buy a used iPhone 14 or 15, any color, 128GB or 256GB. Must be in good condition with no major scratches.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"),
            }),
            700m, 1100m),
        new(new SeedProductBase(
            "furniture", AhmedEmail,
            "Looking for: Office Chair (Ergonomic)",
            "Looking for an ergonomic office chair, ideally Herman Miller, Steelcase or similar. Used is fine.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"),
            }),
            150m, 400m),
        new(new SeedProductBase(
            "books", OmarEmail,
            "Looking for: Programming Books (C#, .NET)",
            "Looking for any recent C#, .NET, or software-architecture books. Bundle deals welcome.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800"),
            }),
            10m, 50m),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Products.AnyAsync())
        {
            return;
        }

        var categories = await dbContext.Categories
            .ToDictionaryAsync(c => c.Slug, c => c.Id);

        var users = await dbContext.Set<User>()
            .ToDictionaryAsync(u => u.Email, u => u.Id);

        foreach (var seed in RegularProducts)
        {
            var product = new RegularProduct
            {
                Title = seed.Base.Title,
                Description = seed.Base.Description,
                CategoryId = categories[seed.Base.CategorySlug],
                OwnerUserId = users[seed.Base.OwnerEmail],
                Condition = seed.Base.Condition,
                LocationCity = seed.Base.City,
                LocationCountry = seed.Base.Country,
                Status = ProductStatus.Active,
                Price = seed.Price,
                AllowNegotiation = seed.AllowNegotiation,
                ProductImages = BuildImages(seed.Base.Images, ProductImageType.Offer),
            };
            dbContext.Products.Add(product);
        }

        foreach (var seed in SwapProducts)
        {
            var product = new SwapProduct
            {
                Title = seed.Base.Title,
                Description = seed.Base.Description,
                CategoryId = categories[seed.Base.CategorySlug],
                OwnerUserId = users[seed.Base.OwnerEmail],
                Condition = seed.Base.Condition,
                LocationCity = seed.Base.City,
                LocationCountry = seed.Base.Country,
                Status = ProductStatus.Active,
                WantedItemTitle = seed.WantedTitle,
                WantedItemDescription = seed.WantedDescription,
                WantedCondition = seed.WantedCondition,
                ProductImages = BuildImages(seed.Base.Images, ProductImageType.Offer),
            };
            dbContext.Products.Add(product);
        }

        foreach (var seed in WantedProducts)
        {
            var product = new WantedProduct
            {
                Title = seed.Base.Title,
                Description = seed.Base.Description,
                CategoryId = categories[seed.Base.CategorySlug],
                OwnerUserId = users[seed.Base.OwnerEmail],
                Condition = seed.Base.Condition,
                LocationCity = seed.Base.City,
                LocationCountry = seed.Base.Country,
                Status = ProductStatus.Active,
                DesiredPriceMin = seed.PriceMin,
                DesiredPriceMax = seed.PriceMax,
                ProductImages = BuildImages(seed.Base.Images, ProductImageType.Wanted),
            };
            dbContext.Products.Add(product);
        }

        await dbContext.SaveChangesAsync();
    }

    private static List<ProductImage> BuildImages(SeedImage[] images, ProductImageType type)
    {
        var list = new List<ProductImage>();
        for (var i = 0; i < images.Length; i++)
        {
            var img = images[i];
            list.Add(new ProductImage
            {
                Url = img.Url,
                DisplayOrder = i,
                Type = type,
                PublicId = $"seed_{Guid.NewGuid():N}",
            });
        }
        return list;
    }
}