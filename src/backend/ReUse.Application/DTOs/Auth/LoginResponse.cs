namespace ReUse.Application.DTOs.Auth;

public record LoginResponse(
    string Email,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    DateTime RefreshTokenExpiresAt
);