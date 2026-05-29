using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

/// <summary>
/// Admin endpoints for moderating feedback
/// </summary>
[ApiController]
[Route("api/admin/feedback")]
[Authorize(Roles = "Admin")]
[Tags("Feedback - Admin")]
public class AdminFeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public AdminFeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    /// <summary>
    /// Get all feedback (Admin view) with filters, sorting and pagination. Excludes soft-deleted feedback.
    /// </summary>
    /// <response code="200">Feedback retrieved successfully</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<FeedbackResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] AdminFeedbackFilterParams filterParams)
    {
        var result = await _feedbackService.GetAllForAdminAsync(filterParams);
        return Ok(result);
    }

    /// <summary>
    /// Delete a feedback (Admin). Performs a soft-delete and recomputes the ratee's rating aggregates.
    /// </summary>
    /// <param name="feedbackId">Feedback ID</param>
    /// <response code="204">Feedback deleted successfully</response>
    /// <response code="404">Feedback not found</response>
    [HttpDelete("{feedbackId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid feedbackId)
    {
        await _feedbackService.SoftDeleteAsync(feedbackId);
        return NoContent();
    }
}