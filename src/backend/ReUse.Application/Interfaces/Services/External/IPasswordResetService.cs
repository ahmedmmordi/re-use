using ReUse.Application.DTOs.Identity.PasswordReset;

namespace ReUse.Application.Interfaces.Services.External;

public interface IPasswordResetService
{
    Task CreateAsync(RequestPasswordResetRequest request);
    Task<VerifyPasswordResetResponse> VerifyAsync(VerifyPasswordResetRequest request);
    Task ResetAsync(ResetPasswordRequest request);
}