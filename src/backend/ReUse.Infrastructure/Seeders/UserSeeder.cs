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
        string PhoneNumber,
        string ProfileImageUrl,
        string CoverImageUrl,
        string AddressLine1,
        string City,
        string StateProvince,
        string PostalCode,
        string Country);

    private static readonly SeedUser[] Users =
    {
        new(
            "ahmedmmordi",
            "Ahmed Mordi",
            "ahmed.mordi@reuse.dev",
            "Tech enthusiast giving gadgets a second life.",
            "+201001234567",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
            "15 El-Tahrir Street",
            "Cairo",
            "Cairo Governorate",
            "11511",
            "Egypt"),
        new(
            "ahmedmohamed",
            "Ahmed Mohamed",
            "ahmed.mohamed@reuse.dev",
            "DIY builder and home-improvement hobbyist.",
            "+201112345678",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200",
            "8 El-Geish Road",
            "Alexandria",
            "Alexandria Governorate",
            "21500",
            "Egypt"),
        new(
            "farahhazem",
            "Farah Hazem",
            "farah.hazem@reuse.dev",
            "Fashion lover passionate about sustainable wardrobes.",
            "+201223456789",
            "https://images.unsplash.com/photo-1514091397859-48b5dbf562a4?w=400",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
            "22 El-Haram Street",
            "Giza",
            "Giza Governorate",
            "12511",
            "Egypt"),
        new(
            "tasabeihtalaat",
            "Tasabeih Talaat",
            "tasabeih.talaat@reuse.dev",
            "Curating preloved treasures with care.",
            "+201334567890",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200",
            "30 El-Corniche Street",
            "Mansoura",
            "Dakahlia Governorate",
            "35511",
            "Egypt"),
        new(
            "omargoher",
            "Omar Goher",
            "omar.goher@reuse.dev",
            "Collector of vintage finds and good deals.",
            "+201445678901",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200",
            "5 El-Gomhoria Street",
            "Tanta",
            "Gharbia Governorate",
            "31511",
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
                    EmailConfirmed = true,
                    LockoutEnabled = true
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
                    PhoneNumber = seed.PhoneNumber,
                    ProfileImageUrl = seed.ProfileImageUrl,
                    CoverImageUrl = seed.CoverImageUrl,
                    AddressLine1 = seed.AddressLine1,
                    City = seed.City,
                    StateProvince = seed.StateProvince,
                    PostalCode = seed.PostalCode,
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