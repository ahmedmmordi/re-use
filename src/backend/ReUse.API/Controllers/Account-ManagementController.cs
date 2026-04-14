using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Users.Account_Management.Commands;
using ReUse.Application.Interfaces.Services.Account_Managemet;

namespace ReUse.API.Controllers;

/// <summary>
/// Provides endpoints for managing the authenticated user's account,
/// including password changes, deactivation, and permanent deletion.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class Account_ManagementController : ControllerBase
{
    private readonly IAccountService _accountService;

    public Account_ManagementController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    /// <summary>
    /// Changes the password of the authenticated user.
    /// </summary>
    /// <param name="command">Contains the current password and the new password.</param>
    /// <returns>No content if the password is successfully changed.</returns>
    /// <response code="204">Password changed successfully.</response>
    /// <response code="400">Invalid input or validation failed.</response>
    /// <response code="403">Current password is incorrect.</response>
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _accountService.ChangePasswordAsync(userId!, command);
        return NoContent();
    }

    /// <summary>
    /// Deactivates the authenticated user's account (soft delete).
    /// </summary>
    /// <param name="command">Contains the required data to confirm deactivation.</param>
    /// <remarks>
    /// This operation performs a soft delete. The account is disabled but all data is preserved
    /// and can be restored later if needed.
    /// </remarks>
    /// <returns>No content if the account is successfully deactivated.</returns>
    //use Patch method => we are updating the IsActive flag of the user to false, and we are not changing any other data of the user
    [HttpPatch("deactivate")]
    [Authorize]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountCommand command)
    {
        var userId = User.GetBusinessId();
        await _accountService.DeactivateAccountAsync(userId, command);
        return NoContent();
    }

    /// <summary>
    /// Permanently deletes the authenticated user's account and all associated data.
    /// </summary>
    /// <param name="command">
    /// Contains the user's current password and a confirmation phrase ("DELETE MY ACCOUNT").
    /// </param>
    /// <remarks>
    /// This operation is irreversible. All user data including profile, products,
    /// orders, and relationships will be permanently removed from the system.
    /// </remarks>

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountCommand command)
    {
        var userId = User.GetBusinessId();
        await _accountService.DeleteAccountAsync(userId, command);
        return NoContent();
    }
}