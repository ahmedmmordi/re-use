
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.API.Responses;
using ReUse.Application.DTOs.Auth;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

/// <summary>
/// Manages authentication sessions such as login, token refresh, and logout.
/// </summary>
/// <remarks>
/// This controller handles JWT-based authentication and refresh token lifecycle.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Tags("Sessions")]
public class SessionsController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public SessionsController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (email == null)
            return Unauthorized();

        var profile = await _userService.GetUserProfileAsync(User.GetBusinessId());
        if (profile is null)
            return Unauthorized();

        return Ok(new
        {
            email,
            role,
            fullName = profile.FullName,
            profileImageUrl = profile.ProfileImageUrl
        });
    }


    /// <summary>
    /// Authenticates a user and creates a new session.
    /// </summary>
    /// <remarks>
    /// Validates user credentials and returns an access token (JWT) and a refresh token.
    ///
    /// **Login Flow:**
    /// 1. Validate email & password
    /// 2. Ensure email is confirmed
    /// 3. Generate JWT access token
    /// 4. Generate refresh token
    /// </remarks>
    /// <param name="request">User login credentials.</param>
    /// <response code="200">Login successful.</response>
    /// <response code="400">Invalid request payload.</response>
    /// <response code="401">Invalid credentials.</response>
    /// <response code="403">email not confirmed.</response>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);

        // Set new refresh token cookie
        Response.Cookies.Append("refresh_token", response.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = response.RefreshTokenExpiresAt,
        });

        // Set access token cookie
        Response.Cookies.Append("access_token", response.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = response.AccessTokenExpiresAt
        });

        return Ok();
    }

    /// <summary>
    /// Refreshes an expired access token using a refresh token.
    /// </summary>
    /// <remarks>
    /// Issues a new access token and refresh token pair if the provided refresh token is valid.
    ///
    /// **Important:**
    /// - Old refresh token will be revoked.
    /// - A new refresh token is returned.
    /// </remarks>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshAsync()
    {
        var refreshToken = Request.Cookies["refresh_token"];

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Missing refresh token" });

        var response = await _authService.RefreshAsync(new RefreshTokenRequest(refreshToken));

        // Set new refresh token cookie
        Response.Cookies.Append("refresh_token", response.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = response.RefreshTokenExpiresAt,
        });

        // Set access token cookie
        Response.Cookies.Append("access_token", response.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = response.AccessTokenExpiresAt
        });

        return Ok();
    }

    /// <summary>
    /// Logs out the currently authenticated user.
    /// </summary>
    /// <remarks>
    /// Revokes all active refresh tokens for the authenticated user.
    ///
    /// **Authorization:**
    /// - Requires a valid JWT access token.
    /// </remarks>
    /// <response code="204">Logout successful.</response>
    /// <response code="401">User is not authenticated.</response>
    [HttpDelete]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _authService.LogoutAsync(userId);

        // Delete refresh token cookie
        Response.Cookies.Append("refresh_token", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTime.UtcNow.AddDays(-1),
        });

        // Delete access token cookie
        Response.Cookies.Append("access_token", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTime.UtcNow.AddDays(-1),
        });
        return NoContent();
    }
}