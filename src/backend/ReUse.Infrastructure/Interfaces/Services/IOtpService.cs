namespace ReUse.Infrastructure.Interfaces.Services;

public interface IOtpService
{
    Task<string> CreateOtpAsync(string key);
    Task VerifyOtpAsync(string key, string otp);
    Task RemoveOtpAsync(string key);
}