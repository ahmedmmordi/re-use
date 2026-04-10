

using System.Security.Claims;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Infrastructure.Interfaces.Repositories;

namespace ReUse.Infrastructure.Repositories;

public class IdentityUserRepository : IIdentityUserRepository
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityUserRepository(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
    {
        return await _userManager.CreateAsync(user, password);
    }

    public async Task<IdentityResult> UpdateAsync(ApplicationUser user)
    {
        return await _userManager.UpdateAsync(user);
    }

    public async Task<IdentityResult> DeleteAsync(ApplicationUser user)
    {
        return await _userManager.DeleteAsync(user);
    }

    public async Task<IdentityResult> AddToRoleAsync(ApplicationUser user, string role)
    {
        return await _userManager.AddToRoleAsync(user, role);
    }

    public async Task<IdentityResult> AddClaimAsync(ApplicationUser user, Claim claim)
    {
        return await _userManager.AddClaimAsync(user, claim);
    }

    public async Task<ApplicationUser?> GetByEmail(string email)
    {
        return await _userManager.FindByEmailAsync(email);
    }

    public async Task<ApplicationUser?> GetByEmailWithRefreshTokens(string email)
    {
        return await _userManager.Users
            .Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.Email == email);
    }

    public async Task<ApplicationUser?> GetByRefreshTokenWithRefreshTokens(string refreshToken)
    {
        return await _userManager.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u
                => u.RefreshTokens.Any(t => t.Token == refreshToken));
    }

    public async Task<ApplicationUser?> GetByIdWithRefreshTokens(string id)
    {
        return await _userManager.Users.Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.Id == id);
    }

    public async Task<bool> CheckPasswordAsync(ApplicationUser user, string password)
    {
        return await _userManager.CheckPasswordAsync(user, password);
    }
}