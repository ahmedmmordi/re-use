namespace ReUse.Application.DTOs.Identity.EmailConfirmation;

public record ConfirmEmailRequest(
    string Email,
    string Otp
);