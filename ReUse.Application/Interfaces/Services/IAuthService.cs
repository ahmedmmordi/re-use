
using ReUse.Application.DTOs.Auth.Login;
using ReUse.Application.DTOs.Auth.Refresh;

namespace ReUse.Application.Interfaces.Services;

public interface IAuthService
{
    //Task<UserProfileDto> RegisterAsync(RegisterDto dto);
    Task<LoginResponseDto> LoginAsync(LoginDto dtp);
    Task<LoginResponseDto> RefreshAsync(RefreshTokenRequestDto refreshToken);
    Task LogoutAsync(string userId);
}