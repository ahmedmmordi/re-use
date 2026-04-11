namespace ReUse.Infrastructure.Models;

public class RefreshTokenModel
{
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}