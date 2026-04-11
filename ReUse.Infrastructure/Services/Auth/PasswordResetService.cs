
using Microsoft.AspNetCore.Identity;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Auth.PasswordRecovery;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Auth;

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

    public async Task CreateAsync(CreatePasswordResetRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            throw new NotFoundException("User");
        }

        var key = $"{ForgetPasswordKey}:{dto.Email}";

        var otp = await _otp.CreateOtpAsync(key);

        await _emailService.SendAsync(
            user.Email,
            "Reset Password",
            $"This is Reset Password Code: <b>{otp}</b>"
        );
    }

    public async Task<VerifyPasswordResetCodeResponseDto> VerifyAsync(VerifyPasswordResetCodeDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            throw new NotFoundException("User");
        }

        var key = $"{ForgetPasswordKey}:{dto.Email}";
        await _otp.VerifyOtpAsync(key, dto.Otp);

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        await _cache.SetAsync(
            $"{ForgetPasswordVerifyKey}:{resetToken}",
            dto.Email,
            TimeSpan.FromMinutes(10)
        );

        await _otp.RemoveOtpAsync(key);

        return new VerifyPasswordResetCodeResponseDto
        {
            ResetToken = resetToken
        };
    }

    public async Task ResetAsync(ResetPasswordDto dto)
    {
        var key = $"{ForgetPasswordVerifyKey}:{dto.ResetToken}";
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
            dto.ResetToken,
            dto.NewPassword
        );

        if (!result.Succeeded)
        {
            throw new IdentityOperationException(
                result.Errors.Select(e => e.Description));
        }

        await _cache.RemoveAsync(key);
    }
}