using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.PasswordRecovery;

public class VerifyPasswordResetCodeDto
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Otp { get; set; } = null!;
}