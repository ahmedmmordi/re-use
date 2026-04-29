namespace ReUse.Application.DTOs.Users.AccountManagement;

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword
);