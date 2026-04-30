using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Follows;
using ReUse.Application.DTOs.Users;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/me/")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly IFollowService _followService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(IFollowService followService, ILogger<FollowsController> logger)
    {
        _followService = followService;
        _logger = logger;
    }


    [ProducesResponseType(typeof(ICollection<FollowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [HttpGet("followers")]
    public async Task<IActionResult> GetFollowers([FromQuery] UserFilterParams filter)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("Fetching followers for user {UserId}", userId);

        var followers = await _followService.GetFollowersAsync(userId, filter);

        return Ok(followers);
    }


    [HttpGet("following")]
    [ProducesResponseType(typeof(ICollection<FollowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetFollowing([FromQuery] UserFilterParams filter)
    {
        var userId = User.GetBusinessId();

        var followings = await _followService.GetFollowingsAsync(userId, filter);
        return Ok(followings);
    }

    [HttpPost("following/{userId}")]
    [ProducesResponseType(typeof(FollowResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> FollowUser([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        var result = await _followService.FollowAsync(currentUserId, userId);


        return CreatedAtAction(nameof(GetFollowers), new { userId = result.FollowingId }, result);
    }

    [HttpDelete("following/{userId}")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnfollowUser([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        await _followService.UnfollowAsync(currentUserId, userId);

        return NoContent();
    }


    [HttpDelete("followers/{userId}")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFollower([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        await _followService.RemoveFollowerAsync(currentUserId, userId);

        return NoContent();
    }
}