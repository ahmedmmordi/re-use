using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class CommentSeeder
{
    private record SeedComment(string Key, string ProductTitle, string AuthorEmail, string Body);
    private record SeedReply(string ParentKey, string AuthorEmail, string Body);

    private const string AhmedMordiEmail = "ahmed.mordi@reuse.dev";
    private const string AhmedMohamedEmail = "ahmed.mohamed@reuse.dev";
    private const string FarahEmail = "farah.hazem@reuse.dev";
    private const string TasabeihEmail = "tasabeih.talaat@reuse.dev";
    private const string OmarEmail = "omar.goher@reuse.dev";

    private static readonly SeedComment[] TopLevelComments =
    {
        new("c1", "LEGO Star Wars Millennium Falcon 75257", AhmedMohamedEmail,
            "Are all the pieces and the instruction booklet included? And is the price negotiable?"),
        new("c2", "Mango Knit Sweater Dress - Size S", FarahEmail,
            "Is the size S true to fit? Interested if so."),
        new("c3", "Adidas Ultraboost 22 - Size 43", FarahEmail,
            "How much wear is on the soles? Thinking of buying as a gift."),
        new("c4", "Zara Floral Midi Dress - Size M", AhmedMordiEmail,
            "Sharing this with my sister, looks like her style."),
        new("c5", "IKEA MALM Desk - White, 140x65 cm", AhmedMordiEmail,
            "Are all the assembly screws included with the desk?"),
        new("c6", "Canon EOS 90D DSLR Body", AhmedMohamedEmail,
            "What's the shutter count exactly? Want it for documenting my build projects."),
        new("c7", "Sony WH-1000XM4 Wireless Headphones", TasabeihEmail,
            "Do they fold flat for travel? Looking for a commute pair."),
        new("c8", "iPhone 13 Pro 256GB - Graphite", OmarEmail,
            "Any scratches on the screen or back? Can you share more photos?"),
        new("c9",  "Google Pixel 7 128GB - Obsidian",       TasabeihEmail,
            "Does it still have any warranty left? And how does the camera hold up in low light?"),
        new("c10", "Lenovo ThinkPad X1 Carbon Gen 9",        AhmedMordiEmail,
            "Does the keyboard have any worn or shiny keys? That's honestly the main reason I want a ThinkPad."),
        new("c11", "Apple AirPods Pro 2nd Generation",       FarahEmail,
            "Are both earbuds working fine? And is this the MagSafe USB-C case or the older lightning one?"),
        new("c12", "KitchenAid Artisan Stand Mixer 4.8L",    TasabeihEmail,
            "Does it come with only the three standard attachments, or are there any extras included?"),
        new("c13", "Adjustable Dumbbell Pair 2-24kg",        AhmedMohamedEmail,
            "Are these the selector-style or spin-lock? And does each one actually go up to 24kg?"),
        new("c14", "LEGO Technic Bugatti Chiron 42083",      OmarEmail,
            "Is it still built as displayed or fully disassembled? And are all the tiny technic pins accounted for?"),
    };

    private static readonly SeedReply[] Replies =
    {
        new("c1", AhmedMordiEmail, "Yes, every piece and the instruction booklet are there. I can do a small discount for a quick pickup."),
        new("c1", AhmedMohamedEmail, "Great, that works for me. Are you free this weekend?"),
        new("c1", AhmedMordiEmail, "Saturday afternoon suits me. I'll message you the location."),

        new("c2", TasabeihEmail, "Yes, it runs true to size, fits a standard S comfortably."),
        new("c2", FarahEmail, "Perfect. Has it been worn much or only a couple of times?"),
        new("c2", TasabeihEmail, "Only twice, still in like-new shape."),

        new("c3", AhmedMordiEmail, "Very little wear, mostly worn indoors. Lots of life left."),
        new("c3", FarahEmail, "Good to hear. Does the original box come with them?"),

        new("c5", AhmedMohamedEmail, "Yes, every screw and the Allen key are in the bag."),
        new("c5", AhmedMordiEmail, "Awesome, I'll take it. Can you hold it until tomorrow?"),
        new("c5", AhmedMohamedEmail, "Sure, no problem. It's reserved for you."),

        new("c6", AhmedMordiEmail, "Around 12k shutter actuations, well within normal range."),
        new("c6", AhmedMohamedEmail, "Perfect for my projects. Are the battery and charger included?"),

        new("c7", AhmedMordiEmail, "Yes, they fold flat and come with a hard case."),
        new("c7", TasabeihEmail, "Perfect for my commute then. I'll take them."),

        new("c8", AhmedMordiEmail, "No scratches at all, kept it in a case. I'll send more photos."),
        new("c8", OmarEmail, "Appreciate it. Looks great, let's arrange a meetup."),

        new("c9",  AhmedMordiEmail,   "Warranty expired last month, but it's in perfect shape. Low light is honestly one of its strongest points."),
        new("c9",  TasabeihEmail,     "Good to know. What's the battery health sitting at roughly?"),
        new("c9",  AhmedMordiEmail,   "Around 89%, still gets through a full day easily."),

        new("c10", OmarEmail,         "Not at all, the keyboard is immaculate. No shine on any key."),
        new("c10", AhmedMordiEmail,   "That's exactly what I wanted to hear. How does the screen handle outdoor glare?"),
        new("c10", OmarEmail,         "It's the matte FHD panel — handles glare well, very comfortable to use outside."),

        new("c11", AhmedMordiEmail,   "Both are perfect, no audio issues at all. And yes, it's the MagSafe USB-C case."),
        new("c11", FarahEmail,        "Great, that's the one I need. Is the price at all flexible?"),
        new("c11", AhmedMordiEmail,   "I can knock a little off for in-person pickup."),

        new("c12", AhmedMohamedEmail, "Just the three standard ones — whisk, dough hook, and flat beater. No extras."),
        new("c12", TasabeihEmail,     "That's all I need. Any issues with the motor at higher speeds?"),
        new("c12", AhmedMohamedEmail, "None at all, runs smoothly on every setting."),

        new("c13", OmarEmail,         "Selector-style, very quick to switch. And yes, each goes up to 24kg."),
        new("c13", AhmedMohamedEmail, "Any cracks on the selector mechanism or the weight plates?"),
        new("c13", OmarEmail,         "Nothing, everything is intact. Honestly never pushed them past 15kg."),

        new("c14", AhmedMordiEmail,   "Still built as displayed. I checked against the manual — every part is there."),
        new("c14", OmarEmail,         "Good to hear. Any damage to the box?"),
        new("c14", AhmedMordiEmail,   "Just some shelf wear on the corners, nothing serious."),
        new("c14", OmarEmail,         "Works for me. Let's sort out the details."),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.ProductComments.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>()
            .ToDictionaryAsync(u => u.Email, u => u.Id);

        var products = await dbContext.Products
            .Select(p => new { p.Id, p.Title })
            .ToListAsync();

        var productsByTitle = products.ToDictionary(p => p.Title, p => p.Id);

        var commentsByKey = new Dictionary<string, ProductComment>();

        var baseTime = DateTime.UtcNow.AddDays(-1);
        var topOffset = 0;
        foreach (var seed in TopLevelComments)
        {
            if (!users.TryGetValue(seed.AuthorEmail, out var userId) ||
                !productsByTitle.TryGetValue(seed.ProductTitle, out var productId))
            {
                continue;
            }

            var comment = new ProductComment
            {
                ProductId = productId,
                UserId = userId,
                Body = seed.Body,
                CreatedAt = baseTime.AddMinutes(topOffset++ * 10),
            };

            commentsByKey[seed.Key] = comment;
            dbContext.ProductComments.Add(comment);
        }

        await dbContext.SaveChangesAsync();

        var replyOffsets = new Dictionary<string, int>();
        foreach (var seed in Replies)
        {
            if (!users.TryGetValue(seed.AuthorEmail, out var userId) ||
                !commentsByKey.TryGetValue(seed.ParentKey, out var parent))
            {
                continue;
            }

            replyOffsets.TryGetValue(seed.ParentKey, out var replyOffset);
            replyOffsets[seed.ParentKey] = replyOffset + 1;

            dbContext.ProductComments.Add(new ProductComment
            {
                ProductId = parent.ProductId,
                UserId = userId,
                Body = seed.Body,
                ParentCommentId = parent.Id,
                CreatedAt = parent.CreatedAt.AddMinutes(replyOffset + 1),
            });
        }

        await dbContext.SaveChangesAsync();
    }
}