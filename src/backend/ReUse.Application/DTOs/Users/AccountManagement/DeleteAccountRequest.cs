namespace ReUse.Application.DTOs.Users.AccountManagement;

public record DeleteAccountRequest(
    string Password,
    string Confirmation,
    string? Reason
);