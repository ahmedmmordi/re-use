
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using AutoMapper;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Auth.Login;
using ReUse.Application.DTOs.Auth.Refresh;
using ReUse.Application.DTOs.Auth.Register;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Auth;

public class JwtAuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IIdentityUserRepository _identityUserRepo;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    public JwtAuthService(
        IUnitOfWork uow,
        ITokenService tokenService,
        IIdentityUserRepository identityUserRepo,
        IMapper mapper
        )
    {
        _uow = uow;
        _tokenService = tokenService;
        _identityUserRepo = identityUserRepo;
        _mapper = mapper;
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

        response.Email = user.Email!;
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

        response.Email = user.Email!;
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

    public async Task<UserProfileDto> RegisterAsync(RegisterDto dto)
    {
        ApplicationUser? identityUser = null;
        User? businessUser = null;

        try
        {

            // 1. Create Identity User

            identityUser = new ApplicationUser
            {
                UserName = dto.UserName,
                Email = dto.Email
            };

            var createUserResult = await _identityUserRepo
                .CreateAsync(identityUser, dto.Password);

            if (!createUserResult.Succeeded)
            {
                throw new IdentityOperationException(
                    createUserResult.Errors.Select(e => e.Description));
            }


            // 2. Assign Role

            var roleResult = await _identityUserRepo
                .AddToRoleAsync(identityUser, "User");

            if (!roleResult.Succeeded)
            {
                throw new IdentityOperationException(
                    roleResult.Errors.Select(e => e.Description));
            }


            // 3. Create Business User

            businessUser = new User
            {
                IdentityUserId = identityUser.Id,
                Email = identityUser.Email,
                FullName = dto.FullName
            };

            _uow.User.Add(businessUser);

            await _uow.SaveChangesAsync();

            // 4. Add Claim (linking)

            var claimResult = await _identityUserRepo.AddClaimAsync(
                identityUser,
                new Claim("business_user_id", businessUser.Id.ToString())
            );

            if (!claimResult.Succeeded)
            {
                throw new IdentityOperationException(
                    claimResult.Errors.Select(e => e.Description));
            }


            // 5. Return DTO
            return _mapper.Map<UserProfileDto>(businessUser);

        }
        catch
        {

            // COMPENSATION LOGIC


            // 1. Delete business user if created
            if (businessUser != null)
            {
                _uow.User.Remove(businessUser);
                await _uow.SaveChangesAsync();
            }

            // 2. Delete identity user if created
            if (identityUser != null)
            {
                await _identityUserRepo.DeleteAsync(identityUser);
            }

            throw;
        }
    }
}