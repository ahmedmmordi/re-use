
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.Exceptions;
using ReUse.Application.Options.Auth;
using ReUse.Infrastructure.Interfaces.Services;
using ReUse.Infrastructure.Models;

namespace ReUse.Infrastructure.Services.Auth;

public class TokenService : ITokenService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtOptions _jwt;
    private readonly RefreshTokenOptions _rToken;

    public TokenService(
        UserManager<ApplicationUser> userManager,
        IOptions<JwtOptions> jwtOptions,
        IOptions<RefreshTokenOptions> rOptions)
    {
        _userManager = userManager;
        _jwt = jwtOptions.Value;
        _rToken = rOptions.Value;
    }

    public async Task<SecurityToken> GenerateJwtAsync(ApplicationUser user)
    {
        // Create user claims
        var userClaims = await _userManager
            .GetClaimsAsync(user);

        var userRoles = await _userManager
            .GetRolesAsync(user);

        foreach (var role in userRoles)
        {
            userClaims.Add(new Claim(ClaimTypes.Role, role));
        }
        userClaims.Add(new Claim(ClaimTypes.NameIdentifier, user.Id));
        userClaims.Add(new Claim(ClaimTypes.Name, user.UserName!));
        userClaims.Add(new Claim(ClaimTypes.Email, user.Email!));

        // prepare signingCredentials
        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_jwt.SigningKey)
            ), SecurityAlgorithms.HmacSha256
        );

        // tokenDescriptor Contains some information which used to create a security token.
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = _jwt.Issuer,
            Audience = _jwt.Audience,
            Expires = DateTime.Now.AddMinutes(_jwt.Lifetime),
            SigningCredentials = signingCredentials,
            Subject = new ClaimsIdentity(userClaims)
        };

        // create token
        // A SecurityTokenHandler designed for creating and validating Json Web Tokens.
        var tokenHandler = new JwtSecurityTokenHandler();

        var securityToken = tokenHandler.CreateToken(tokenDescriptor); // create token with info in tokenDescriptor
        return securityToken;
    }

    public async Task<RefreshTokenModel> CreateRefreshTokenAsync(ApplicationUser user, string? refreshToken = null)
    {
        // Check if token is valid and Revoke It
        if (refreshToken != null)
        {
            var oldToken = user.RefreshTokens
                .FirstOrDefault(t => t.Token == refreshToken);

            if (oldToken == null || oldToken.IsExpired || oldToken.IsRevoked)
            {
                throw new InvalidRefreshTokenException();
            }
            oldToken.RevokedAt = DateTime.UtcNow;
        }

        var token = GenerateRefreshToken();

        var newRefreshToken = new RefreshTokenModel()
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_rToken.Lifetime),
        };

        user.RefreshTokens.Add(new RefreshToken
        {
            Token = token,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = newRefreshToken.ExpiresAt
        });

        var identityResult = await _userManager.UpdateAsync(user);
        if (!identityResult.Succeeded)
        {
            // throw new IdentityOperationException(
            // identityResult.Errors.Select(e => e.Description));
        }

        return newRefreshToken;
    }

    public void RevokeAllAsync(ApplicationUser user)
    {
        var activeTokens = user.RefreshTokens.Where(t => t.IsActive);
        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }
}