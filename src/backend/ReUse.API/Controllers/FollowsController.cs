using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Follows;
using ReUse.Application.DTOs.Users;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FollowsController : ControllerBase
{
    private readonly IFollowService _followService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(IFollowService followService, ILogger<FollowsController> logger)
    {
        _followService = followService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all followers for a specific user.
    /// </summary>
    /// <remarks>
    /// Returns a list of users who are following the specified user.
    /// An empty array is returned if the user has no followers.
    [ProducesResponseType(typeof(ICollection<FollowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [HttpGet("/My/Followers")]
    public async Task<IActionResult> GetFollowers([FromQuery] UserFilterParams filter)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("Fetching followers for user {UserId}", userId);

        var followers = await _followService.GetFollowersAsync(userId, filter);

        return Ok(followers);
    }
    /// <summary>
    /// Retrieves the list of users that the currently authenticated user is following.
    /// </summary>
    /// <remarks>
    /// Returns all accounts the current user follows.
    /// An empty array is returned when the user follows nobody.
    [ProducesResponseType(typeof(ICollection<FollowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]

    [HttpGet("/My/Following")]
    public async Task<IActionResult> GetFollowing([FromQuery] UserFilterParams filter)
    {
        var userId = User.GetBusinessId();

        var followings = await _followService.GetFollowingsAsync(userId, filter);
        return Ok(followings);
    }

    /// <summary>
    /// Follow a target user on behalf of the currently authenticated user.
    /// </summary>
    /// <remarks>
    /// Creates a following relationship between the authenticated user and the target user.
    /// The authenticated user becomes a follower of the target user.
    [ProducesResponseType(typeof(FollowResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]

    [HttpPost("/Follow/{userId}")]
    public async Task<IActionResult> FollowUser([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        var result = await _followService.FollowAsync(currentUserId, userId);


        return CreatedAtAction(nameof(GetFollowers), new { userId = result.FollowingId }, result);
    }

    /// <summary>
    /// Unfollows a target user on behalf of the currently authenticated user.
    /// </summary>
    /// <remarks>
    /// Removes the following relationship between the authenticated user and the target user.
    /// Returns 404 if the relationship doesn't exist or the target user is not found.
    /// </remarks>
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [HttpDelete("/UnFollow/{userId}")]
    public async Task<IActionResult> UnfollowUser([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        await _followService.UnfollowAsync(currentUserId, userId);

        return NoContent();
    }

    /// <summary>
    /// Removes a follower from the currently authenticated user's followers list.
    /// </summary>
    /// <remarks>
    /// Deletes the follow relationship where the specified user is following you.
    /// Returns 404 if the specified user is not currently following you.
    /// </remarks>
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [HttpDelete("/Removefollower/{userId}")]
    public async Task<IActionResult> RemoveFollower([FromRoute] Guid userId)
    {
        var currentUserId = User.GetBusinessId();

        await _followService.RemoveFollowerAsync(currentUserId, userId);

        return NoContent();
    }
}