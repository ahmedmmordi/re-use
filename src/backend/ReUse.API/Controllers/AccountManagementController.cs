using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Users.AccountManagement;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
[Tags("AccountManagement")]
public class AccountManagementController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountManagementController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _accountService.ChangePasswordAsync(userId!, request);
        return NoContent();
    }

    [HttpPatch("deactivation")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountRequest request)
    {
        var userId = User.GetBusinessId();
        await _accountService.DeactivateAccountAsync(userId, request);
        return NoContent();
    }


    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeactivateAccountRequest request)
    {
        var userId = User.GetBusinessId();
        await _accountService.DeleteAccountAsync(userId, request);
        return NoContent();
    }
}