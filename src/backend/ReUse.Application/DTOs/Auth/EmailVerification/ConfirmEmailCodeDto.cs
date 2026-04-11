using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.EmailVerification;

public class ConfirmEmailCodeDto
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;

    [Required, StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = null!;
}