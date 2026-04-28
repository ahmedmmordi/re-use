namespace ReUse.Application.DTOs.Users.AccountManagement;

public class DeleteAccountRequest
{
    public string Password { get; set; } = null!;

    public string Confirmation { get; set; } = null!;

    public string? Reason { get; set; }
}