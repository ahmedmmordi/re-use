//
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using ReUse.API.Extensions;
// using ReUse.API.Responses;
// using ReUse.Application.DTOs.Auth.Register;
// using ReUse.Application.DTOs.User;
// using ReUse.Application.Interfaces.Services;
//
// namespace ReUse.API.Controllers;
//
// /// <summary>
// /// Manage user accounts and user profile data
// /// </summary>
// [ApiController]
// [Route("api/[controller]")]
// [Tags("Users")]
// public class UsersController : ControllerBase
// {
//     private readonly IAuthService _authService;
//     private readonly IUserService _userService;
//
//     public UsersController(IAuthService authService, IUserService userService)
//     {
//         _authService = authService;
//         _userService = userService;
//     }
//     
//     /// <summary>
//     /// Register a new user account
//     /// </summary>
//     /// <param name="dto">User registration data</param>
//     /// <returns>The created user profile</returns>
//     /// <response code="201">User registered successfully</response>
//     /// <response code="400">Invalid request data</response>
//     [HttpPost]
//     [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status201Created)]
//     [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
//     public async Task<IActionResult> RegisterAsync([FromBody] RegisterDto dto)
//     {
//         var user = await _authService.RegisterAsync(dto);
//         return CreatedAtAction("GetById", user);
//     }
//
//     /// <summary>
//     /// Get the authenticated user's profile
//     /// </summary>
//     /// <returns>User profile information</returns>
//     /// <response code="200">Profile retrieved successfully</response>
//     /// <response code="401">User is not authenticated</response>
//     /// <response code="403">User is not authorized (User only)</response>
//     [Authorize(Roles = "User")]
//     [HttpGet("me")]
//     [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
//     [ProducesResponseType(typeof(ErrorResponse),StatusCodes.Status401Unauthorized)]
//     [ProducesResponseType(typeof(ErrorResponse),StatusCodes.Status403Forbidden)]
//     public async Task<IActionResult> GetByIdAsync()
//     {
//         var userId = ClaimsPrincipalExtensions.GetUserId(User);
//         
//         var userProfile = await _userService.GetByIdAsync(userId);
//         
//         return Ok(userProfile);
//     }
//
//     /// <summary>
//     /// Update the authenticated user's profile
//     /// </summary>
//     /// <param name="dto">Updated user data</param>
//     /// <response code="204">Profile updated successfully</response>
//     /// <response code="400">Invalid request data</response>
//     /// <response code="401">User is not authenticated</response>
//     /// <response code="403">User is not authorized (User only)</response>
//     [Authorize(Roles = "User")]
//     [HttpPatch("me")]
//     [ProducesResponseType(StatusCodes.Status204NoContent)]
//     [ProducesResponseType(typeof(ErrorResponse),StatusCodes.Status400BadRequest)]
//     [ProducesResponseType(typeof(ErrorResponse),StatusCodes.Status403Forbidden)]
//     [ProducesResponseType(typeof(ErrorResponse),StatusCodes.Status401Unauthorized)]
//     public async Task<IActionResult> UpdateAsync([FromBody] UpdateUserDto dto)
//     {
//         var userId = ClaimsPrincipalExtensions.GetUserId(User);
//         
//         await _userService.UpdateAsync(userId, dto);
//         return NoContent();
//     }
//     
// }