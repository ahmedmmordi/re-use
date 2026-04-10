namespace ReUse.Infrastructure.Models;

public class OtpCacheModel
{
    public string Otp { get; set; } = null!;
    public int AttemptsLeft { get; set; }
}