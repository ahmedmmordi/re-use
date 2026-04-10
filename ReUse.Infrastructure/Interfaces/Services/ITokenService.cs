using Microsoft.IdentityModel.Tokens;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Infrastructure.Models;

namespace ReUse.Infrastructure.Interfaces.Services;

public interface ITokenService
{
    Task<SecurityToken> GenerateJwtAsync(ApplicationUser user);
    Task<RefreshTokenModel> CreateRefreshTokenAsync(ApplicationUser user, string? refreshToken = null);
    void RevokeAllAsync(ApplicationUser user);
}