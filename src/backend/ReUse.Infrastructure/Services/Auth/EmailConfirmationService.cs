using ReUse.Application.DTOs.Auth.EmailVerification;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Auth;

public class EmailConfirmationService : IEmailConfirmationService
{
    private readonly IIdentityUserRepository _identityUserRepo;
    private readonly IEmailService _emailService;
    private readonly IOtpService _otp;

    public EmailConfirmationService(
        IIdentityUserRepository identityUserRepo,
        IEmailService emailService,
        IOtpService otp)
    {
        _identityUserRepo = identityUserRepo;
        _emailService = emailService;
        _otp = otp;
    }

    public async Task SendAsync(SendEmailConfirmationCodeDto dto)
    {
        var user = await _identityUserRepo.GetByEmail(dto.Email);

        if (user == null || user.EmailConfirmed)
        {
            return;
        }

        var key = $"email-confirm:{dto.Email}";
        var otp = await _otp.CreateOtpAsync(key);

        await _emailService.SendAsync(
            user.Email,
            "Confirm your email",
            $"This is Confirmation Code: <b>{otp}</b>"
        );
    }

    public async Task ConfirmAsync(ConfirmEmailCodeDto confirmEmailDto)
    {
        var user = await _identityUserRepo.GetByEmail(confirmEmailDto.Email);
        if (user == null || user.EmailConfirmed)
        {
            return;
        }

        var key = $"email-confirm:{confirmEmailDto.Email}";

        await _otp.VerifyOtpAsync(key, confirmEmailDto.Otp);

        user.EmailConfirmed = true;
        var result = await _identityUserRepo.UpdateAsync(user);

        if (!result.Succeeded)
            throw new IdentityOperationException(result.Errors
                .Select(e => e.Description));

        await _otp.RemoveOtpAsync(key);
    }
}