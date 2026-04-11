using ReUse.Application.DTOs.Auth.EmailVerification;

namespace ReUse.Application.Interfaces.Services.Auth;

public interface IEmailConfirmationService
{
    Task SendAsync(SendEmailConfirmationCodeDto dto);
    Task ConfirmAsync(ConfirmEmailCodeDto dto);
}