using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Identity.EmailConfirmation;

public class SendEmailConfirmationRequest
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;
}