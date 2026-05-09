using System.Security.Claims;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Seeders;

public static class UserSeeder
{
    private const string DefaultPassword = "User@123";
    private const string UserRole = "User";

    private record SeedUser(
        string UserName,
        string FullName,
        string Email,
        string Bio,
        string City,
        string Country);

    private static readonly SeedUser[] Users =
    {
        new(
            "ahmedhassan",
            "Ahmed Hassan",
            "ahmed.hassan@reuse.dev",
            "Tech enthusiast giving gadgets a second life.",
            "Cairo",
            "Egypt"),
        new(
            "sarahmahmoud",
            "Sarah Mahmoud",
            "sarah.mahmoud@reuse.dev",
            "Fashion lover passionate about sustainable wardrobes.",
            "Alexandria",
            "Egypt"),
        new(
            "omarkhaled",
            "Omar Khaled",
            "omar.khaled@reuse.dev",
            "DIY builder and home-improvement hobbyist.",
            "Giza",
            "Egypt"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var dbContext = services.GetRequiredService<ApplicationDbContext>();

        foreach (var seed in Users)
        {
            var identityUser = await userManager.FindByEmailAsync(seed.Email);
            if (identityUser == null)
            {
                identityUser = new ApplicationUser
                {
                    UserName = seed.UserName,
                    Email = seed.Email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(identityUser, DefaultPassword);
                if (!result.Succeeded)
                {
                    throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            if (!await userManager.IsInRoleAsync(identityUser, UserRole))
            {
                await userManager.AddToRoleAsync(identityUser, UserRole);
            }

            var domainUserExists = await dbContext.Set<User>()
                .AnyAsync(u => u.IdentityUserId == identityUser.Id);

            if (!domainUserExists)
            {
                var domainUser = new User
                {
                    IdentityUserId = identityUser.Id,
                    Email = seed.Email,
                    FullName = seed.FullName,
                    Bio = seed.Bio,
                    City = seed.City,
                    Country = seed.Country,
                };

                dbContext.Add(domainUser);
                await dbContext.SaveChangesAsync();

                await userManager.AddClaimAsync(identityUser, new Claim(
                    "business_user_id",
                    domainUser.Id.ToString()
                ));
            }
        }
    }
}