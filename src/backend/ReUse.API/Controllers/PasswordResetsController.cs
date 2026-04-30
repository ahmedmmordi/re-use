
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Identity.PasswordReset;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

/// <summary>
/// Handles password recovery and reset operations.
/// </summary>
/// <remarks>
/// This controller manages the full password reset flow:
/// 1. Request password reset (send OTP)
/// 2. Verify OTP and issue reset token
/// 3. Reset password using reset token
/// </remarks>
[ApiController]
[Route("api/password-resets")]
[AllowAnonymous]
[Tags("PasswordResets")]
public class PasswordResetsController : ControllerBase
{
    private readonly IPasswordResetService _passwordResetService;

    public PasswordResetsController(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    /// <summary>
    /// Initiates the password reset process.
    /// </summary>
    /// <remarks>
    /// Sends a one-time password (OTP) to the user's email address.
    /// </remarks>
    /// <param name="request">Password reset request containing the user's email.</param>
    /// <response code="202">Password reset request accepted.</response>
    /// <response code="400">Invalid request payload.</response>
    /// <response code="404">User not found.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAsync(RequestPasswordResetRequest request)
    {
        await _passwordResetService.CreateAsync(request);
        return Accepted();
    }

    /// <summary>
    /// Verifies the password reset OTP code.
    /// </summary>
    /// <remarks>
    /// Validates the OTP sent to the user's email and returns a short-lived reset token.
    ///
    /// **Rules:**
    /// - OTP expires after 10 minutes
    /// - Limited number of verification attempts
    /// </remarks>
    /// <param name="request">OTP verification request.</param>
    /// <returns>Password reset token.</returns>
    /// <response code="200">OTP verified successfully.</response>
    /// <response code="400">Invalid or expired OTP.</response>
    /// <response code="404">User not found.</response>
    [HttpPut("verify")]
    [ProducesResponseType(typeof(VerifyPasswordResetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyAsync(VerifyPasswordResetRequest request)
    {
        var token = await _passwordResetService.VerifyAsync(request);
        return Ok(token);
    }

    /// <summary>
    /// Resets the user's password using a valid reset token.
    /// </summary>
    /// <remarks>
    /// Updates the user's password and invalidates the reset token.
    /// </remarks>
    /// <param name="request">Password reset request.</param>
    /// <response code="204">Password reset successfully.</response>
    /// <response code="400">Invalid or expired reset token.</response>
    /// <response code="404">User not found.</response>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetAsync(ResetPasswordRequest request)
    {
        await _passwordResetService.ResetAsync(request);
        return NoContent();
    }
}