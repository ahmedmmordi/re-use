using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class FollowSeeder
{
    private record SeedFollow(string FollowerEmail, string FollowingEmail);

    private const string AhmedMordiEmail = "ahmed.mordi@reuse.dev";
    private const string AhmedMohamedEmail = "ahmed.mohamed@reuse.dev";
    private const string FarahEmail = "farah.hazem@reuse.dev";
    private const string TasabeihEmail = "tasabeih.talaat@reuse.dev";
    private const string OmarEmail = "omar.goher@reuse.dev";

    private static readonly SeedFollow[] Follows =
    {
        new(AhmedMordiEmail, AhmedMohamedEmail),
        new(AhmedMordiEmail, FarahEmail),
        new(AhmedMohamedEmail, AhmedMordiEmail),
        new(FarahEmail, AhmedMordiEmail),
        new(TasabeihEmail, AhmedMordiEmail),
        new(TasabeihEmail, FarahEmail),
        new(OmarEmail, AhmedMordiEmail),
        new(OmarEmail, TasabeihEmail),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        if (await dbContext.Follows.AnyAsync())
        {
            return;
        }

        var users = await dbContext.Set<User>()
            .ToDictionaryAsync(u => u.Email, u => u.Id);

        foreach (var seed in Follows)
        {
            if (!users.TryGetValue(seed.FollowerEmail, out var followerId) ||
                !users.TryGetValue(seed.FollowingEmail, out var followingId) ||
                followerId == followingId)
            {
                continue;
            }

            dbContext.Follows.Add(new Follow
            {
                FollowerId = followerId,
                FollowingId = followingId,
            });
        }

        await dbContext.SaveChangesAsync();
    }
}