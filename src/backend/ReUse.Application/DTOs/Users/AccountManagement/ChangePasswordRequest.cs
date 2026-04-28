namespace ReUse.Application.DTOs.Users.AccountManagement;

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = null!;

    public string NewPassword { get; set; } = null!;

    public string ConfirmNewPassword { get; set; } = null!;
}