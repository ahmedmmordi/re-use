using System;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;

using Reuse.Infrastructure.Identity.Models;

using ReUse.Application.DTOs.Users.Account_Management.Commands;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.Account_Managemet;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Account_Management;

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

    public async Task ChangePasswordAsync(string userId, ChangePasswordCommand command)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            throw new NotFoundException(nameof(ApplicationUser));

        var result = await _userManager.ChangePasswordAsync(user, command.CurrentPassword, command.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new IdentityOperationException(errors);
        }
    }

    public async Task DeactivateAccountAsync(Guid userId, DeactivateAccountCommand command)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId)
            ?? throw new NotFoundException(nameof(User));

        if (!user.IsActive)
            throw new ConflictException("Account is already deactivated.");

        var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
            ?? throw new NotFoundException(nameof(ApplicationUser));

        var passwordValid = await _userManager.CheckPasswordAsync(identityUser, command.Password);
        if (!passwordValid)
            throw new ForbiddenException();

        user.IsActive = false;
        user.DeactivatedAt = DateTime.UtcNow;
        user.DeactivationReason = command.Reason;

        _tokenService.RevokeAllAsync(identityUser);
        await _userManager.UpdateSecurityStampAsync(identityUser);

        await _unitOfWork.SaveChangesAsync();

        await _cache.RemoveAsync($"user:active:{userId}");
    }

    //public async Task ReactivateAccountAsync(Guid userId, ReactivateAccountCommand command)
    //{
    //    var user = await _unitOfWork.User.GetByIdAsync(userId)
    //        ?? throw new NotFoundException(nameof(User));

    //    if (user.IsActive)
    //        return;

    //    var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
    //        ?? throw new NotFoundException(nameof(ApplicationUser));

    //    if (!await _userManager.CheckPasswordAsync(identityUser, command.Password))
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

    public async Task DeleteAccountAsync(Guid userId, DeleteAccountCommand command)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId)
            ?? throw new NotFoundException(nameof(User));

        var identityUser = await _userManager.FindByIdAsync(user.IdentityUserId)
            ?? throw new NotFoundException(nameof(ApplicationUser));

        var passwordValid = await _userManager.CheckPasswordAsync(identityUser, command.Password);
        if (!passwordValid)
            throw new ForbiddenException();

        await _unitOfWork.Follows.DeleteByUserIdAsync(userId);
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