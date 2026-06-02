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

    private const string AhmedMordiEmail = "ahmed.mordi@reuse.dev";
    private const string AhmedMohamedEmail = "ahmed.mohamed@reuse.dev";
    private const string FarahEmail = "farah.hazem@reuse.dev";
    private const string TasabeihEmail = "tasabeih.talaat@reuse.dev";
    private const string OmarEmail = "omar.goher@reuse.dev";

    private static readonly SeedRegular[] RegularProducts =
    {
        new(new SeedProductBase(
            "phones-accessories", AhmedMordiEmail,
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
            "laptops-computers", AhmedMordiEmail,
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
            "audio", AhmedMordiEmail,
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
            "cameras", AhmedMordiEmail,
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
            "gaming", AhmedMordiEmail,
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
            "women-dresses", FarahEmail,
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
            "women-bags", FarahEmail,
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
            "women-shoes", FarahEmail,
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
            "women-jewelry", FarahEmail,
            "Pandora Sterling Silver Charm Bracelet",
            "Authentic Pandora sterling silver bracelet with 5 charms. Comes with original pouch and certificate.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"),
            }),
            120m, true),
        new(new SeedProductBase(
            "women-tops", FarahEmail,
            "H&M Linen Blouse - Size S",
            "White linen blouse from H&M, size S. Brand new with tags.",
            ProductCondition.New, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800"),
            }),
            22m, false),

        new(new SeedProductBase(
            "furniture", AhmedMohamedEmail,
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
            "power-tools", AhmedMohamedEmail,
            "Bosch GSB 13 RE Impact Drill",
            "Bosch GSB 13 RE 600W impact drill. Used on a couple of home projects. Comes with carrying case and bits.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800"),
            }),
            65m, true),
        new(new SeedProductBase(
            "hand-tools", AhmedMohamedEmail,
            "Stanley 65-piece Tool Kit",
            "Complete Stanley 65-piece home tool set. Used a few times. All pieces present, original case.",
            ProductCondition.LikeNew, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1585569695919-db237e7cc455?w=800"),
            }),
            55m, false),
        new(new SeedProductBase(
            "decor", AhmedMohamedEmail,
            "Vintage Brass Table Lamp",
            "Vintage brass table lamp, fully working. Adds a warm tone to any room. Bulb included.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"),
            }),
            40m, true),
        new(new SeedProductBase(
            "kitchen-dining", AhmedMohamedEmail,
            "Le Creuset Cast Iron Dutch Oven 4.5L",
            "Le Creuset enameled cast iron Dutch oven, 4.5L, cherry red. Light surface wear, fully functional.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"),
            }),
            150m, true),

        new(new SeedProductBase(
            "men-shoes", AhmedMordiEmail,
            "Adidas Ultraboost 22 - Size 43",
            "Adidas Ultraboost 22 running shoes, EU 43. Used for casual wear, lots of life left.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"),
            }),
            70m, true),
        new(new SeedProductBase(
            "men-watches", AhmedMordiEmail,
            "Seiko 5 Automatic SNK809",
            "Seiko 5 automatic men's watch, black dial. Keeps great time. Original strap included.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800"),
            }),
            95m, false),
        new(new SeedProductBase(
            "books", FarahEmail,
            "Atomic Habits by James Clear - Hardcover",
            "Atomic Habits by James Clear, hardcover edition. Read once, like-new condition.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800"),
            }),
            14m, false),
        new(new SeedProductBase(
            "bicycles", AhmedMohamedEmail,
            "Trek FX 3 Hybrid Bicycle - Size L",
            "Trek FX 3 hybrid bike, size L (56 cm). Great for city commuting. Recently serviced.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800"),
            }),
            420m, true),
        new(new SeedProductBase(
            "lego-building", AhmedMordiEmail,
            "LEGO Star Wars Millennium Falcon 75257",
            "LEGO Star Wars Millennium Falcon set 75257. Built once, all pieces and instructions included.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"),
            }),
            130m, true),

        new(new SeedProductBase(
            "women-dresses", TasabeihEmail,
            "Mango Knit Sweater Dress - Size S",
            "Mango ribbed knit sweater dress in beige, size S. Worn a couple of times, very cozy for autumn.",
            ProductCondition.LikeNew, "Mansoura", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800"),
            }),
            38m, true),
        new(new SeedProductBase(
            "books", TasabeihEmail,
            "The Alchemist by Paulo Coelho - Paperback",
            "The Alchemist by Paulo Coelho, paperback. Gently read, no markings. A timeless classic.",
            ProductCondition.LikeNew, "Mansoura", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"),
            }),
            10m, false),
        new(new SeedProductBase(
            "kitchen-dining", TasabeihEmail,
            "Bialetti Moka Express 6-Cup",
            "Bialetti Moka Express stovetop espresso maker, 6-cup. Lightly used, makes great coffee.",
            ProductCondition.Used, "Mansoura", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1678225315909-677b8a657bf2?w=800"),
            }),
            28m, true),

        new(new SeedProductBase(
            "phones-accessories", OmarEmail,
            "Samsung Galaxy S22 128GB - Phantom Black",
            "Samsung Galaxy S22, 128GB, Phantom Black. Battery in great shape. Includes case and charger.",
            ProductCondition.LikeNew, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800"),
            }),
            540m, true),
        new(new SeedProductBase(
            "audio", OmarEmail,
            "JBL Flip 6 Portable Bluetooth Speaker",
            "JBL Flip 6 waterproof Bluetooth speaker in blue. Excellent sound, barely used. Charging cable included.",
            ProductCondition.LikeNew, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800"),
            }),
            90m, false),
        new(new SeedProductBase(
            "gaming", OmarEmail,
            "Nintendo Switch OLED - White",
            "Nintendo Switch OLED model, white Joy-Cons. Screen protector applied since day one. Dock and cables included.",
            ProductCondition.LikeNew, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800"),
            }),
            310m, true),

        new(new SeedProductBase(
            "phones-accessories", AhmedMordiEmail,
            "Google Pixel 7 128GB - Obsidian",
            "Google Pixel 7, 128GB, Obsidian. Clean Android, great camera. Battery health excellent. Includes case.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"),
            }),
            430m, true),
        new(new SeedProductBase(
            "laptops-computers", OmarEmail,
            "Lenovo ThinkPad X1 Carbon Gen 9",
            "ThinkPad X1 Carbon Gen 9, i7, 16GB, 512GB SSD. Light business use. Excellent keyboard, no dents.",
            ProductCondition.Used, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800"),
            }),
            780m, true),
        new(new SeedProductBase(
            "cameras", OmarEmail,
            "Fujifilm X-T30 Mirrorless with 15-45mm",
            "Fujifilm X-T30 with kit 15-45mm lens. Compact mirrorless, great for street photography. Low shutter count.",
            ProductCondition.LikeNew, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1452780212441-02cc2b1e4a6d?w=800"),
            }),
            620m, false),
        new(new SeedProductBase(
            "audio", AhmedMordiEmail,
            "Apple AirPods Pro 2nd Generation",
            "AirPods Pro 2nd gen with MagSafe case. Active noise cancellation. Includes all ear tips and box.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800"),
            }),
            170m, true),

        new(new SeedProductBase(
            "women-shoes", FarahEmail,
            "Dr. Martens 1460 Boots - Women's Size 39",
            "Classic Dr. Martens 1460 in black, women's EU 39. Broken in and comfortable. Plenty of wear left.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800"),
            }),
            75m, true),
        new(new SeedProductBase(
            "women-bags", FarahEmail,
            "Kate Spade Crossbody Bag - Black",
            "Kate Spade pebbled leather crossbody in black. Adjustable strap, gold hardware. Authentic with dust bag.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"),
            }),
            140m, true),
        new(new SeedProductBase(
            "women-jewelry", FarahEmail,
            "Swarovski Crystal Pendant Necklace",
            "Swarovski crystal pendant necklace, rhodium plated. Comes in original box. Sparkling, like new.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"),
            }),
            90m, false),
        new(new SeedProductBase(
            "women-tops", FarahEmail,
            "Mango Oversized Blazer - Size M",
            "Mango oversized blazer in camel, size M. Tailored fit, worn twice. Perfect for office or evening.",
            ProductCondition.LikeNew, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800"),
            }),
            60m, true),

        new(new SeedProductBase(
            "power-tools", AhmedMohamedEmail,
            "Makita Cordless Circular Saw 18V",
            "Makita 18V cordless circular saw. Body only, no battery. Used on a few projects, runs smoothly.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800"),
            }),
            110m, true),
        new(new SeedProductBase(
            "furniture", AhmedMohamedEmail,
            "Mid-Century Wooden Bookshelf",
            "Solid oak mid-century bookshelf, 5 shelves. Minor surface marks. Sturdy and easy to move.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800"),
            }),
            130m, true),
        new(new SeedProductBase(
            "decor", AhmedMohamedEmail,
            "Handmade Ceramic Vase Set of 3",
            "Set of three handmade ceramic vases in earth tones. No chips. Great accent for a shelf or table.",
            ProductCondition.LikeNew, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800"),
            }),
            45m, false),
        new(new SeedProductBase(
            "kitchen-dining", AhmedMohamedEmail,
            "KitchenAid Artisan Stand Mixer 4.8L",
            "KitchenAid Artisan stand mixer in empire red, 4.8L bowl. Includes whisk, dough hook and beater.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=800"),
            }),
            260m, true),

        new(new SeedProductBase(
            "fitness-equipment", OmarEmail,
            "Adjustable Dumbbell Pair 2-24kg",
            "Pair of adjustable dumbbells, 2-24kg each. Space-saving design. Light home use, all plates intact.",
            ProductCondition.LikeNew, "Tanta", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"),
            }),
            200m, true),
        new(new SeedProductBase(
            "camping-hiking", TasabeihEmail,
            "Coleman 4-Person Dome Tent",
            "Coleman 4-person dome tent, waterproof. Used on two trips. Includes carry bag and all poles.",
            ProductCondition.Used, "Mansoura", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800"),
            }),
            85m, true),
        new(new SeedProductBase(
            "books", TasabeihEmail,
            "Sapiens by Yuval Noah Harari - Paperback",
            "Sapiens by Yuval Noah Harari, paperback. Read once, no markings. A fascinating history of humankind.",
            ProductCondition.LikeNew, "Mansoura", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1589998059171-988d887df646?w=800"),
            }),
            12m, false),
        new(new SeedProductBase(
            "lego-building", AhmedMordiEmail,
            "LEGO Technic Bugatti Chiron 42083",
            "LEGO Technic Bugatti Chiron set 42083. Built once and displayed. All pieces and manual included.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"),
                new SeedImage("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"),
            }),
            280m, true),
    };

    private static readonly SeedSwap[] SwapProducts =
    {
        new(new SeedProductBase(
            "gaming", AhmedMordiEmail,
            "Xbox Series S - Swap for Nintendo Switch OLED",
            "Xbox Series S in mint condition with one controller. Looking to swap for a Nintendo Switch OLED in similar condition.",
            ProductCondition.LikeNew, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800"),
            }),
            "Nintendo Switch OLED", "White or neon edition preferred.", ProductCondition.LikeNew),
        new(new SeedProductBase(
            "women-bags", FarahEmail,
            "Coach Crossbody Bag - Swap for Designer Wallet",
            "Coach leather crossbody bag, brown. Looking to swap for a designer wallet (Coach, Michael Kors, Kate Spade).",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800"),
            }),
            "Designer Wallet", "Any condition or brand is welcome.", ProductCondition.LikeNew),
        new(new SeedProductBase(
            "bicycles", AhmedMohamedEmail,
            "Mountain Bike - Swap for Road Bike",
            "Hardtail mountain bike, size M. Open to swapping for a road bike of similar value.",
            ProductCondition.Used, "Giza", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800"),
            }),
            "Road Bike", "Aluminum or carbon frame, size M or L.", ProductCondition.Used),
    };

    private static readonly SeedWanted[] WantedProducts =
    {
        new(new SeedProductBase(
            "phones-accessories", FarahEmail,
            "Looking for: iPhone 14 or 15",
            "Looking to buy a used iPhone 14 or 15, any color, 128GB or 256GB. Must be in good condition with no major scratches.",
            ProductCondition.Used, "Alexandria", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"),
            }),
            700m, 1100m),
        new(new SeedProductBase(
            "furniture", AhmedMordiEmail,
            "Looking for: Office Chair (Ergonomic)",
            "Looking for an ergonomic office chair, ideally Herman Miller, Steelcase or similar. Used is fine.",
            ProductCondition.Used, "Cairo", "Egypt",
            new[]
            {
                new SeedImage("https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"),
            }),
            150m, 400m),
        new(new SeedProductBase(
            "books", AhmedMohamedEmail,
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