using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Identity.PasswordReset;

public class RequestPasswordResetRequest
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;
}