using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using AutoMapper;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Auth;
using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Auth;

public class JwtAuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IIdentityUserRepository _identityUserRepo;
    private readonly ITokenService _tokenService;
    private readonly IAccountService _accountService;
    private readonly IMapper _mapper;
    public JwtAuthService(
        IUnitOfWork uow,
        ITokenService tokenService,
        IIdentityUserRepository identityUserRepo,
        IMapper mapper,
        IAccountService accountService
        )
    {
        _uow = uow;
        _tokenService = tokenService;
        _identityUserRepo = identityUserRepo;
        _accountService = accountService;
        _mapper = mapper;
    }
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _identityUserRepo.GetByEmail(request.Email);

        if (user == null || !await _identityUserRepo.CheckPasswordAsync(user, request.Password))
        {
            throw new InvalidCredentialsException();
        }

        if (!user.EmailConfirmed)
        {
            throw new EmailNotConfirmedException();
        }

        var domainUser = await _uow.User.GetByIdentityIdAsync(user.Id)
         ?? throw new NotFoundException(nameof(User));

        //  Auto-reactivate if account is deactivated
        //    This is the ONLY place reactivation happens no separate endpoint needed.
        await _accountService.EnsureActiveOnLoginAsync(domainUser.Id);

        var jwtToken = await _tokenService.GenerateJwtAsync(user);

        var refreshToken = await _tokenService.CreateRefreshTokenAsync(user);

        return new LoginResponse(user.Email!, new JwtSecurityTokenHandler().WriteToken(jwtToken), refreshToken.Token, jwtToken.ValidTo, refreshToken.ExpiresAt);
    }

    public async Task<LoginResponse> RefreshAsync(RefreshTokenRequest refreshToken)
    {
        var user = await _identityUserRepo.GetByRefreshTokenWithRefreshTokens(refreshToken.RefreshToken);

        if (user == null)
        {
            throw new InvalidRefreshTokenException();
        }

        var newRefreshToken = await _tokenService.CreateRefreshTokenAsync(user, refreshToken.RefreshToken);

        var jwtToken = await _tokenService.GenerateJwtAsync(user);

        return new LoginResponse(user.Email!, new JwtSecurityTokenHandler().WriteToken(jwtToken), newRefreshToken.Token, jwtToken.ValidTo, newRefreshToken.ExpiresAt);
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

    public async Task<UserProfileResponse> RegisterAsync(RegisterRequest dto)
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
            return _mapper.Map<UserProfileResponse>(businessUser);

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