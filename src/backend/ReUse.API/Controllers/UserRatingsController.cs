using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/users/{userId:guid}/ratings")]
public class UserRatingsController : ControllerBase
{
    private readonly IRatingService _ratingService;

    public UserRatingsController(IRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<RatingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReceived(
        [FromRoute] Guid userId,
        [FromQuery] PaginationParams pagination,
        [FromQuery] SortDirection sortDirection = SortDirection.Desc)
    {
        var result = await _ratingService.GetReceivedByUserAsync(userId, pagination, sortDirection);
        return Ok(result);
    }

    [HttpGet("summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserRatingSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSummary([FromRoute] Guid userId)
    {
        var result = await _ratingService.GetUserSummaryAsync(userId);
        return Ok(result);
    }
}