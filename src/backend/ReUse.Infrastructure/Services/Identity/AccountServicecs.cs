using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Users.AccountManagement;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Identity;

public class AccountService : IAccountService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IDistributedCache _cache;

    public AccountService(
        UserManager<ApplicationUser> userManager,
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IDistributedCache cache)
    {
        _userManager = userManager;
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _cache = cache;
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            throw new NotFoundException(nameof(ApplicationUser));

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new IdentityOperationException(errors);
        }
    }

    public async Task DeactivateAccountAsync(Guid userId, DeactivateAccountRequest request)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId)
            ?? throw new NotFoundException(nameof(User));

        if (!user.IsActive)
            throw new ConflictException("Account is already deactivated.");

        var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
            ?? throw new NotFoundException(nameof(ApplicationUser));

        var passwordValid = await _userManager.CheckPasswordAsync(identityUser, request.Password);
        if (!passwordValid)
            throw new ForbiddenException();

        user.IsActive = false;
        user.DeactivatedAt = DateTime.UtcNow;
        user.DeactivationReason = request.Reason;

        _tokenService.RevokeAllAsync(identityUser);
        await _userManager.UpdateSecurityStampAsync(identityUser);

        await _unitOfWork.SaveChangesAsync();

        await _cache.RemoveAsync($"user:active:{userId}");
    }

    //public async Task ReactivateAccountAsync(Guid userId, ReactivateAccountCommand request)
    //{
    //    var user = await _unitOfWork.User.GetByIdAsync(userId)
    //        ?? throw new NotFoundException(nameof(User));

    //    if (user.IsActive)
    //        return;

    //    var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
    //        ?? throw new NotFoundException(nameof(ApplicationUser));

    //    if (!await _userManager.CheckPasswordAsync(identityUser, request.Password))
    //        throw new ForbiddenException();

    //    user.IsActive = true;
    //    user.DeactivatedAt = null;
    //    user.DeactivationReason = null;

    //    await _userManager.UpdateSecurityStampAsync(identityUser);
    //    await _unitOfWork.SaveChangesAsync();

    //    await _cache.RemoveAsync($"user:active:{userId}");
    //}

    public async Task EnsureActiveOnLoginAsync(Guid userId)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);

        if (user == null)
            throw new NotFoundException(nameof(User));

        if (user.IsActive)
            return;

        user.IsActive = true;
        user.DeactivatedAt = null;
        user.DeactivationReason = null;

        await _unitOfWork.SaveChangesAsync();

        await _cache.RemoveAsync($"user:active:{userId}");
    }

    public async Task DeleteAccountAsync(Guid userId, DeactivateAccountRequest request)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId)
            ?? throw new NotFoundException(nameof(User));

        var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
            ?? throw new NotFoundException(nameof(ApplicationUser));

        var passwordValid = await _userManager.CheckPasswordAsync(identityUser, request.Password);
        if (!passwordValid)
            throw new ForbiddenException();

        await _unitOfWork.Follow.DeleteByUserIdAsync(userId);
        _unitOfWork.User.Remove(user);

        _tokenService.RevokeAllAsync(identityUser);
        var result = await _userManager.DeleteAsync(identityUser);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new IdentityOperationException(errors);
        }

        await _unitOfWork.SaveChangesAsync();

        await _cache.RemoveAsync($"user:active:{userId}");
    }


}