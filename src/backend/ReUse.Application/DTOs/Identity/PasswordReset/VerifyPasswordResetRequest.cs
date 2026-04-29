namespace ReUse.Application.DTOs.Identity.PasswordReset;

public record VerifyPasswordResetRequest(
    string Email,
    string Otp
);