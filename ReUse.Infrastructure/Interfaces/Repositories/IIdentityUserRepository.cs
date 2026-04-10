using System.Security.Claims;

using Microsoft.AspNetCore.Identity;

using Reuse.Infrastructure.Identity.Models;

namespace ReUse.Infrastructure.Interfaces.Repositories;

// I use this repo becuase testing be easyer than use usermanager directly
public interface IIdentityUserRepository
{
    Task<IdentityResult> CreateAsync(ApplicationUser user, string password);
    Task<IdentityResult> UpdateAsync(ApplicationUser user);
    Task<IdentityResult> DeleteAsync(ApplicationUser user);
    Task<IdentityResult> AddToRoleAsync(ApplicationUser user, string role);
    Task<IdentityResult> AddClaimAsync(ApplicationUser user, Claim claim);
    Task<ApplicationUser?> GetByEmail(string email);
    Task<ApplicationUser?> GetByEmailWithRefreshTokens(string email);
    Task<ApplicationUser?> GetByRefreshTokenWithRefreshTokens(string refreshToken);
    Task<ApplicationUser?> GetByIdWithRefreshTokens(string id);
    Task<bool> CheckPasswordAsync(ApplicationUser user, string password);
}