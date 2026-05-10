using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/me/category-follows")]
[Authorize]
public class CategoryFollowsController : ControllerBase
{
    private readonly ICategoryFollowService _categoryFollowService;
    private readonly ILogger<CategoryFollowsController> _logger;

    public CategoryFollowsController(
        ICategoryFollowService categoryFollowService,
        ILogger<CategoryFollowsController> logger)
    {
        _categoryFollowService = categoryFollowService;
        _logger = logger;
    }

    // GET api/me/category-follows
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CategoryFollowResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFollowedCategories([FromQuery] PaginationParams pagination)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("Fetching followed categories for user {UserId}", userId);
        var result = await _categoryFollowService.GetFollowedCategoriesAsync(userId, pagination);
        return Ok(result);
    }

    // POST api/me/category-follows/{categoryId}
    [HttpPost("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> FollowCategory([FromRoute] Guid categoryId)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("User {UserId} following category {CategoryId}", userId, categoryId);
        await _categoryFollowService.FollowAsync(userId, categoryId);
        return Created();
    }

    // DELETE api/me/category-follows/{categoryId}
    [HttpDelete("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnfollowCategory([FromRoute] Guid categoryId)
    {
        var userId = User.GetBusinessId();
        _logger.LogInformation("User {UserId} unfollowing category {CategoryId}", userId, categoryId);
        await _categoryFollowService.UnfollowAsync(userId, categoryId);
        return NoContent();
    }
}