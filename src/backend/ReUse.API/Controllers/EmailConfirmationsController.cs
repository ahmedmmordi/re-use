
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Identity.EmailConfirmation;
using ReUse.Application.Interfaces.Services.External;

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
[AllowAnonymous]
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
    /// <param name="request">Email confirmation request.</param>
    /// <response code="202">Email confirmation request accepted.</response>
    /// <response code="400">Invalid request payload.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendAsync(SendEmailConfirmationRequest request)
    {
        await _emailConfirmationService.SendAsync(request);
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
    /// <param name="request">Email confirmation data.</param>
    /// <response code="204">Email confirmed successfully.</response>
    /// <response code="400">Invalid or expired OTP.</response>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmAsync(ConfirmEmailRequest request)
    {
        await _emailConfirmationService.ConfirmAsync(request);
        return NoContent();
    }
}