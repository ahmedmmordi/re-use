using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.API.Responses;
using ReUse.Application.DTOs.Auth.Register;
using ReUse.Application.DTOs.Users.UserProfile.Commands;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Application.Interfaces.Services.UserProfile;
using ReUse.Application.Options.Enums;

namespace ReUse.API.Controllers;

/// <summary>
/// Manage user accounts and user profile data
/// </summary>
[ApiController]
[Route("me")]
[Tags("Users")]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    public UsersController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="dto">User registration data</param>
    /// <returns>The created user profile</returns>
    /// <response code="201">User registered successfully</response>
    /// <response code="400">Invalid request data</response>
    [HttpPost("/register")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterAsync([FromBody] RegisterDto dto)
    {
        var user = await _authService.RegisterAsync(dto);
        return Created("me", user);

    }

    /// <summary>
    /// Get the authenticated user's profile
    /// </summary>
    /// <returns>User profile information</returns>
    /// <response code="200">Profile retrieved successfully</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized (User only)</response>
    [Authorize(Roles = "User,Admin")]
    [HttpGet("")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetByIdAsync()
    {
        var userId = User.GetBusinessId();

        var userProfile = await _userService.GetUserProfileAsync(userId);

        return Ok(userProfile);
    }

    /// <summary>
    /// Update the authenticated user's profile
    /// </summary>
    /// <param name="dto">Updated user data</param>
    /// <response code="204">Profile updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized (User only)</response>
    [Authorize(Roles = "User,Admin")]
    [HttpPatch("/info")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAsync([FromBody] UpdateUserProfileCommand dto)
    {
        var userId = User.GetBusinessId();
        await _userService.UpdateUserProfileAsync(userId, dto);
        return NoContent();
    }

    /// <summary>
    /// Update the authenticated user's profile image
    /// </summary>
    /// <param name="command">Profile image file</param>
    /// <returns>No content if updated successfully</returns>
    /// <response code="204">Profile image updated successfully</response>
    /// <response code="400">Invalid request (missing image or invalid data)</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized</response>
    [HttpPut("images/profile")]
    public Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileImageCommand command)
      => UpdateImage(command.Image, ProfileImageOptions.Profile);

    /// <summary>
    /// Update the authenticated user's cover image
    /// </summary>
    /// <param name="command">Cover image file</param>
    /// <returns>No content if updated successfully</returns>
    /// <response code="204">Cover image updated successfully</response>
    /// <response code="400">Invalid request (missing image or invalid data)</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized</response>
    [HttpPut("images/cover")]
    public Task<IActionResult> UpdateCoverImage([FromForm] UpdateProfileImageCommand command)
        => UpdateImage(command.Image, ProfileImageOptions.Cover);

    /// <summary>
    /// Delete the authenticated user's profile image
    /// </summary>
    /// <returns>No content if deleted successfully</returns>
    /// <response code="204">Profile image deleted successfully</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized</response>
    [HttpDelete("images/profile")]
    public Task<IActionResult> DeleteProfileImage()
        => DeleteImage(ProfileImageOptions.Profile);

    /// <summary>
    /// Delete the authenticated user's cover image
    /// </summary>
    /// <returns>No content if deleted successfully</returns>
    /// <response code="204">Cover image deleted successfully</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="403">User is not authorized</response>
    [HttpDelete("images/cover")]
    public Task<IActionResult> DeleteCoverImage()
        => DeleteImage(ProfileImageOptions.Cover);

    private async Task<IActionResult> UpdateImage(IFormFile image, ProfileImageOptions type)
    {
        var userId = User.GetBusinessId();
        if (image == null)
            return BadRequest("Image is required");

        await _userService.UpdateImageProfileAsync(
            userId!, new UpdateProfileImageCommand(image, type));

        return NoContent();
    }

    private async Task<IActionResult> DeleteImage(ProfileImageOptions type)
    {
        var userId = User.GetBusinessId();

        await _userService.DeleteProfileImageAsync(userId!, type);
        return NoContent();
    }

}