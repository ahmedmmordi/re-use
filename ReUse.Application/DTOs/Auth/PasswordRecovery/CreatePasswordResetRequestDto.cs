using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.PasswordRecovery;

public class CreatePasswordResetRequestDto
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;
}