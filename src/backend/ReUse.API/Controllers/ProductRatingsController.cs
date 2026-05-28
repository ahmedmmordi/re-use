using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.API.Responses;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
[Route("api/products/{productId:guid}/ratings")]
public class ProductRatingsController : ControllerBase
{
    private readonly IRatingService _ratingService;

    public ProductRatingsController(IRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<RatingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRatings([FromRoute] Guid productId)
    {
        var result = await _ratingService.GetByProductIdAsync(productId);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(RatingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateRating(
        [FromRoute] Guid productId,
        [FromBody] CreateRatingRequest request)
    {
        var raterUserId = User.GetBusinessId();
        var result = await _ratingService.CreateAsync(productId, raterUserId, request);
        return CreatedAtAction(nameof(GetRatings), new { productId }, result);
    }
}