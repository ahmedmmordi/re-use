
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Auth.Login;
using ReUse.Application.DTOs.Auth.Refresh;
using ReUse.Application.DTOs.Auth.Register;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services;

public class JwtAuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IIdentityUserRepository _identityUserRepo;
    private readonly ITokenService _tokenService;
    public JwtAuthService(
        IUnitOfWork uow,
        ITokenService tokenService,
        IIdentityUserRepository identityUserRepo
        )
    {
        _uow = uow;
        _tokenService = tokenService;
        _identityUserRepo = identityUserRepo;
    }
    public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
    {
        var response = new LoginResponseDto();

        var user = await _identityUserRepo.GetByEmail(loginDto.Email);

        if (user == null || !await _identityUserRepo.CheckPasswordAsync(user, loginDto.Password))
        {
            throw new InvalidCredentialsException();
        }

        if (!user.EmailConfirmed)
        {
            throw new EmailNotConfirmedException();
        }

        var jwtToken = await _tokenService.GenerateJwtAsync(user);

        var refreshToken = await _tokenService.CreateRefreshTokenAsync(user);

        response.Email = user.Email;
        response.AccessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);
        response.AccessTokenExpiresAt = jwtToken.ValidTo;
        response.RefreshToken = refreshToken.Token;
        response.RefreshTokenExpiresAt = refreshToken.ExpiresAt;

        return response;
    }

    public async Task<LoginResponseDto> RefreshAsync(RefreshTokenRequestDto refreshToken)
    {
        var response = new LoginResponseDto();

        var user = await _identityUserRepo.GetByRefreshTokenWithRefreshTokens(refreshToken.RefreshToken);

        if (user == null)
        {
            throw new InvalidRefreshTokenException();
        }

        var newRefreshToken = await _tokenService.CreateRefreshTokenAsync(user, refreshToken.RefreshToken);

        var jwtToken = await _tokenService.GenerateJwtAsync(user);

        response.Email = user.Email;
        response.AccessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);
        response.AccessTokenExpiresAt = jwtToken.ValidTo;
        response.RefreshToken = newRefreshToken.Token;
        response.RefreshTokenExpiresAt = newRefreshToken.ExpiresAt;

        return response;
    }

    public async Task LogoutAsync(string identityUserId)
    {
        var user = await _identityUserRepo.GetByIdWithRefreshTokens(identityUserId);

        if (user == null)
        {
            return;
        }
        _tokenService.RevokeAllAsync(user);

        await _identityUserRepo.UpdateAsync(user);
    }
}