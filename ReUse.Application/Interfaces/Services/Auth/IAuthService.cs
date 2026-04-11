using ReUse.Application.DTOs.Auth.Login;
using ReUse.Application.DTOs.Auth.Refresh;
using ReUse.Application.DTOs.Auth.Register;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;

namespace ReUse.Application.Interfaces.Services.Auth;

public interface IAuthService
{
    Task<UserProfileDto> RegisterAsync(RegisterDto dto);
    Task<LoginResponseDto> LoginAsync(LoginDto dtp);
    Task<LoginResponseDto> RefreshAsync(RefreshTokenRequestDto refreshToken);
    Task LogoutAsync(string userId);
}