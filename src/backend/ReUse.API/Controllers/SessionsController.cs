
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Auth.Login;
using ReUse.Application.DTOs.Auth.Refresh;
using ReUse.Application.Interfaces.Services.Auth;

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

    public SessionsController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (email == null)
            return Unauthorized();

        return Ok(new
        {
            email,
            role
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
    /// <param name="dto">User login credentials.</param>
    /// <response code="200">Login successful.</response>
    /// <response code="400">Invalid request payload.</response>
    /// <response code="401">Invalid credentials.</response>
    /// <response code="403">email not confirmed.</response>
    [HttpPost]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LoginAsync([FromBody] LoginDto dto)
    {
        var response = await _authService.LoginAsync(dto);

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
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshAsync()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Missing refresh token" });

        var response = await _authService.RefreshAsync(new RefreshTokenRequestDto() { RefreshToken = refreshToken });

        // Set new refresh token cookie
        Response.Cookies.Append("refresh_token", response.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = response.RefreshTokenExpiresAt,
            Path = "/auth/refresh"
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
    [Authorize]
    [HttpDelete]
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
            Path = "/auth/refresh"
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