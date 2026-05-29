using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/users/{userId:guid}/feedback")]
public class UserFeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public UserFeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<FeedbackResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReceived(
        [FromRoute] Guid userId,
        [FromQuery] PaginationParams pagination,
        [FromQuery] SortDirection sortDirection = SortDirection.Desc)
    {
        var result = await _feedbackService.GetReceivedByUserAsync(userId, pagination, sortDirection);
        return Ok(result);
    }

    [HttpGet("summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserFeedbackSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSummary([FromRoute] Guid userId)
    {
        var result = await _feedbackService.GetUserSummaryAsync(userId);
        return Ok(result);
    }
}