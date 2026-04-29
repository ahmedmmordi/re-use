namespace ReUse.Application.DTOs.Identity.PasswordReset;

public record ResetPasswordRequest(
    string ResetToken,
    string NewPassword
);