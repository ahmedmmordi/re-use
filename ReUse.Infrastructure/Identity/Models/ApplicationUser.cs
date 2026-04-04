using Microsoft.AspNetCore.Identity;

namespace Reuse.Infrastructure.Identity.Models;

public class ApplicationUser : IdentityUser
{
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}