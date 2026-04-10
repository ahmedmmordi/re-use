
using ReUse.Application.DTOs.Auth.PasswordRecovery;

namespace ReUse.Application.Interfaces.Services;

public interface IPasswordResetService
{
    Task CreateAsync(CreatePasswordResetRequestDto dto);
    Task<VerifyPasswordResetCodeResponseDto> VerifyAsync(VerifyPasswordResetCodeDto dto);
    Task ResetAsync(ResetPasswordDto dto);
}