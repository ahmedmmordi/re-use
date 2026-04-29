
using ReUse.Application.DTOs.Auth;
using ReUse.Application.DTOs.Users.UserProfile;

namespace ReUse.Application.Interfaces.Services.External;

public interface IAuthService
{
    Task<UserProfileResponse> RegisterAsync(RegisterRequest dto);
    Task<LoginResponse> LoginAsync(LoginRequest dtp);
    Task<LoginResponse> RefreshAsync(RefreshTokenRequest refreshToken);
    Task LogoutAsync(string userId);
}