using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.API.Responses;
using ReUse.Application.DTOs.Auth;
using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
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

    [AllowAnonymous]
    [HttpPost("/api/users")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterAsync([FromBody] RegisterRequest request)
    {
        var user = await _authService.RegisterAsync(request);
        return Created("me", user);

    }

    [HttpGet]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetByIdAsync()
    {
        var userId = User.GetBusinessId();

        var userProfile = await _userService.GetUserProfileAsync(userId);

        return Ok(userProfile);
    }


    [HttpPatch]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAsync([FromBody] UpdateUserProfileRequest request)
    {
        var userId = User.GetBusinessId();
        await _userService.UpdateUserProfileAsync(userId, request);
        return NoContent();
    }


    [HttpPut("profile-image")]
    public Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileImageRequest request)
      => UpdateImage(request.Image, ProfileImageOptions.Profile);

    [HttpPut("cover-image")]
    public Task<IActionResult> UpdateCoverImage([FromForm] UpdateProfileImageRequest request)
        => UpdateImage(request.Image, ProfileImageOptions.Cover);

    [HttpDelete("profile-image")]
    public Task<IActionResult> DeleteProfileImage()
        => DeleteImage(ProfileImageOptions.Profile);

    [HttpDelete("cover-image")]
    public Task<IActionResult> DeleteCoverImage()
        => DeleteImage(ProfileImageOptions.Cover);

    private async Task<IActionResult> UpdateImage(IFormFile image, ProfileImageOptions type)
    {
        var userId = User.GetBusinessId();

        await _userService.UpdateImageProfileAsync(
            userId!, new UpdateProfileImageRequest { Image = image, ImageType = type });

        return NoContent();
    }

    private async Task<IActionResult> DeleteImage(ProfileImageOptions type)
    {
        var userId = User.GetBusinessId();

        await _userService.DeleteProfileImageAsync(userId!, type);
        return NoContent();
    }

}