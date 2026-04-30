
using Microsoft.AspNetCore.Identity;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Identity.PasswordReset;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Identity;

public class PasswordResetService : IPasswordResetService
{
    private const string ForgetPasswordKey = "forget-password";
    private const string ForgetPasswordVerifyKey = "forget-password:verified";
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IOtpService _otp;
    private readonly IAppCache _cache;

    public PasswordResetService(
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        IOtpService otp,
        IAppCache cache
        )
    {
        _userManager = userManager;
        _emailService = emailService;
        _otp = otp;
        _cache = cache;
    }

    public async Task CreateAsync(RequestPasswordResetRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            throw new NotFoundException("User");
        }

        var key = $"{ForgetPasswordKey}:{request.Email}";

        var otp = await _otp.CreateOtpAsync(key);

        await _emailService.SendAsync(
            user.Email,
            "Reset Password",
            $"This is Reset Password Code: <b>{otp}</b>"
        );
    }

    public async Task<VerifyPasswordResetResponse> VerifyAsync(VerifyPasswordResetRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            throw new NotFoundException("User");
        }

        var key = $"{ForgetPasswordKey}:{request.Email}";
        await _otp.VerifyOtpAsync(key, request.Otp);

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        await _cache.SetAsync(
            $"{ForgetPasswordVerifyKey}:{resetToken}",
            request.Email,
            TimeSpan.FromMinutes(10)
        );

        await _otp.RemoveOtpAsync(key);

        return new VerifyPasswordResetResponse(resetToken);
    }

    public async Task ResetAsync(ResetPasswordRequest request)
    {
        var key = $"{ForgetPasswordVerifyKey}:{request.ResetToken}";
        var email = await _cache.GetAsync<string>(key);

        if (email == null)
        {
            throw new InvalidResetPasswordTokenException();
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // throw new NotFoundException("User");
        }

        var result = await _userManager.ResetPasswordAsync(
            user,
            request.ResetToken,
            request.NewPassword
        );

        if (!result.Succeeded)
        {
            throw new IdentityOperationException(
                result.Errors.Select(e => e.Description));
        }

        await _cache.RemoveAsync(key);
    }
}