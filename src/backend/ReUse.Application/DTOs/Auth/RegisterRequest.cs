namespace ReUse.Application.DTOs.Auth;

public record RegisterRequest(
    string UserName,
    string FullName,
    string Email,
    string Password
);