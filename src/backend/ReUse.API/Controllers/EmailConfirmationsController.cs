
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Auth.EmailVerification;
using ReUse.Application.Interfaces.Services.Auth;

namespace ReUse.API.Controllers;

/// <summary>
/// Manages email confirmation operations.
/// </summary>
/// <remarks>
/// This controller handles email verification using a one-time password (OTP).
///
/// **Flow:**
/// 1. Send confirmation code to email
/// 2. Confirm email using OTP
/// </remarks>
[ApiController]
[Route("api/email-confirmations")]
[Tags("EmailConfirmations")]
public class EmailConfirmationsController : ControllerBase
{
    private readonly IEmailConfirmationService _emailConfirmationService;

    public EmailConfirmationsController(IEmailConfirmationService emailConfirmationService)
    {
        _emailConfirmationService = emailConfirmationService;
    }

    /// <summary>
    /// Sends an email confirmation code to the specified email address.
    /// </summary>
    /// <remarks>
    /// **Behavior:**
    /// - Generates a one-time password (OTP).
    /// - Sends the OTP via email.
    /// </remarks>
    /// <param name="dto">Email confirmation request.</param>
    /// <response code="202">Email confirmation request accepted.</response>
    /// <response code="400">Invalid request payload.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendAsync(SendEmailConfirmationCodeDto dto)
    {
        await _emailConfirmationService.SendAsync(dto);
        // I Choose 202 becuse this is async operation 
        return Accepted();
    }

    /// <summary>
    /// Confirms a user's email address using a verification code.
    /// </summary>
    /// <remarks>
    /// Validates the OTP and marks the user's email as confirmed.
    ///
    /// **Rules:**
    /// - OTP expires after 10 minutes
    /// - Limited number of verification attempts
    /// </remarks>
    /// <param name="dto">Email confirmation data.</param>
    /// <response code="204">Email confirmed successfully.</response>
    /// <response code="400">Invalid or expired OTP.</response>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [HttpPut]
    public async Task<IActionResult> ConfirmAsync(ConfirmEmailCodeDto dto)
    {
        await _emailConfirmationService.ConfirmAsync(dto);
        return NoContent();
    }
}