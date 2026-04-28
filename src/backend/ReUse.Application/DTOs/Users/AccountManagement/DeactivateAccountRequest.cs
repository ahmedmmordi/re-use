namespace ReUse.Application.DTOs.Users.AccountManagement;

public class DeactivateAccountRequest
{
    public string Password { get; set; } = null!;

    public string? Reason { get; set; }
}