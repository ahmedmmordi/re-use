namespace ReUse.Application.DTOs.Identity.EmailConfirmation;

public class ConfirmEmailRequest
{
    public string Email { get; set; } = null!;

    public string Otp { get; set; } = null!;
}