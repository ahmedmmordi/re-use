using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Users.Account_Management.Commands;

namespace ReUse.Application.Interfaces.Services.Account_Managemet;

public interface IAccountService
{
    Task ChangePasswordAsync(string userId, ChangePasswordCommand command);
    Task DeactivateAccountAsync(Guid userId, DeactivateAccountCommand command);

    // Task ReactivateAccountAsync(Guid userId);
    Task EnsureActiveOnLoginAsync(Guid userId);
    Task DeleteAccountAsync(Guid userId, DeleteAccountCommand command);
}