using ReUse.Application.DTOs.Users.AccountManagement;

namespace ReUse.Application.Interfaces.Services.External;

public interface IAccountService
{
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request);
    Task DeactivateAccountAsync(Guid userId, DeactivateAccountRequest request);

    // Task ReactivateAccountAsync(Guid userId);
    Task EnsureActiveOnLoginAsync(Guid userId);
    Task DeleteAccountAsync(Guid userId, DeactivateAccountRequest request);
}