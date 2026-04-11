
using System.Security.Cryptography;

using ReUse.Application.Exceptions;
using ReUse.Infrastructure.Interfaces.Services;
using ReUse.Infrastructure.Models;

namespace ReUse.Infrastructure.Services.Auth;

public class OtpService : IOtpService
{
    private readonly IAppCache _cache;
    public OtpService(IAppCache cache)
    {
        _cache = cache;
    }

    public async Task<string> CreateOtpAsync(string key)
    {
        var otp = GenerateOtp();

        var value = new OtpCacheModel
        {
            Otp = otp,
            AttemptsLeft = 2
        };

        await _cache.SetAsync(
            key,
            value,
            TimeSpan.FromMinutes(10)
        );

        return otp;
    }

    public async Task VerifyOtpAsync(string key, string otp)
    {
        var cached = await _cache.GetAsync<OtpCacheModel>(key);

        if (cached is null)
        {
            throw new InvalidOtpException();
        }

        if (cached.AttemptsLeft <= 0)
        {
            throw new InvalidOtpException();
        }

        if (cached.Otp != otp)
        {
            cached.AttemptsLeft--;

            await _cache.SetAsync(
                key,
                cached,
                TimeSpan.FromMinutes(10)
            );

            throw new InvalidOtpException();
        }
    }

    public async Task RemoveOtpAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }

    private string GenerateOtp()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    }
}