using ReUse.Application.DTOs.Identity.PasswordReset;

namespace ReUse.Application.Interfaces.Services.External;

public interface IPasswordResetService
{
    Task CreateAsync(RequestPasswordResetRequest dto);
    Task<VerifyPasswordResetResponse> VerifyAsync(VerifyPasswordResetRequest dto);
    Task ResetAsync(ResetPasswordRequest dto);
}