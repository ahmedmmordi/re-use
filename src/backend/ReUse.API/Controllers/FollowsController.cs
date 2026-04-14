using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Users.Follows.Contracts;
using ReUse.Application.Interfaces.Services.Follows;
using ReUse.Application.Options.Filters;
using ReUse.Domain.Entities;

namespace ReUse.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FollowsController : ControllerBase
{
    private readonly IFollowsService _followsService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(IFollowsService followsService, ILogger<FollowsController> logger)
    {
        _followsService = followsService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all followers for a specific user.
    /// </summary>
    /// <remarks>
    /// Returns a list of users who are following the specified user.
    /// An empty array is returned if the user has no followers.
    [ProducesResponseType(typeof(ICollection<FollowsDtos>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [HttpGet("/My/Followers")]
    public async Task<IActionResult> GetFollowers([FromQuery] UserQueryOptions query)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("Fetching followers for user {UserId}", userId);

        var followers = await _followsService.GetFollowersAsync(userId, query);

        return Ok(followers);
    }
    /// <summary>
    /// Retrieves the list of users that the currently authenticated user is following.
    /// </summary>
    /// <remarks>
    /// Returns all accounts the current user follows.
    /// An empty array is returned when the user follows nobody.
    [ProducesResponseType(typeof(ICollection<FollowsDtos>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]

    [HttpGet("/My/Following")]
    public async Task<IActionResult> GetFollowing([FromQuery] UserQueryOptions query)
    {
        var userId = User.GetBusinessId();

        var followings = await _followsService.GetFollowingsAsync(userId, query);
        return Ok(followings);
    }

    /// <summary>
    /// Follows a target user on behalf of the currently authenticated user.
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

        var result = await _followsService.FollowAsync(currentUserId, userId);


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

        await _followsService.UnfollowAsync(currentUserId, userId);

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

        await _followsService.RemoveFollowerAsync(currentUserId, userId);

        return NoContent();
    }
}