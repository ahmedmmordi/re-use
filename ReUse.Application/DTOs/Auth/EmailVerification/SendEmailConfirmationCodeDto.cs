using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.EmailVerification;

public class SendEmailConfirmationCodeDto
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;
}