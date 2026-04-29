namespace ReUse.Application.DTOs.Users.AccountManagement;

public record DeactivateAccountRequest(
    string Password,
    string? Reason
);