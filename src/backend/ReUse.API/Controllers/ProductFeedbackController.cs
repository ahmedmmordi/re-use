using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.API.Responses;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
[Route("api/products/{productId:guid}/feedback")]
public class ProductFeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public ProductFeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<FeedbackResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFeedback([FromRoute] Guid productId)
    {
        var result = await _feedbackService.GetByProductIdAsync(productId);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(FeedbackResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateFeedback(
        [FromRoute] Guid productId,
        [FromBody] CreateFeedbackRequest request)
    {
        var raterUserId = User.GetBusinessId();
        var result = await _feedbackService.CreateAsync(productId, raterUserId, request);
        return CreatedAtAction(nameof(GetFeedback), new { productId }, result);
    }
}