
namespace ReUse.Application.DTOs.Identity.PasswordReset;

public class VerifyPasswordResetRequest
{
    public string Email { get; set; } = null!;

    public string Otp { get; set; } = null!;
}