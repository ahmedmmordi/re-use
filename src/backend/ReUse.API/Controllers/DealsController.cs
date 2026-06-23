using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Deals.Requests;
using ReUse.Application.DTOs.Deals.Responses;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Enums;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
public class DealsController : ControllerBase
{
    private readonly IDealService _dealService;
    private readonly ILogger<DealsController> _logger;

    public DealsController(IDealService dealService, ILogger<DealsController> logger)
    {
        _dealService = dealService;
        _logger = logger;
    }

    /// <summary>
    /// Proposes a deal inside an existing conversation.
    /// Who can propose depends on product type (Regular→owner, Swap→either, Wanted→reactant).
    /// </summary>
    [HttpPost("api/conversations/{conversationId:guid}/deals")]
    [ProducesResponseType(typeof(DealResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDeal(
        [FromRoute] Guid conversationId,
        [FromBody] CreateDealRequest request)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} proposing deal in conversation {ConversationId}",
            callerId, conversationId);

        var result = await _dealService.CreateDealAsync(conversationId, request, callerId);

        return CreatedAtAction(nameof(GetActiveDeal), new { conversationId }, result);
    }

    /// <summary>
    /// Accept or Reject a Pending deal. Only the receiver can call this.
    /// </summary>
    [HttpPatch("api/deals/{dealId:guid}/status")]
    [ProducesResponseType(typeof(DealResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RespondToDeal(
        [FromRoute] Guid dealId,
        [FromBody] RespondToDealRequest request)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} responding to deal {DealId} with action {Action}",
            callerId, dealId, request.Action);

        var result = await _dealService.RespondToDealAsync(dealId, request, callerId);

        return Ok(result);
    }

    /// <summary>
    /// Marks an Accepted deal as Done. Either participant can call this.
    /// Product status becomes Closed.
    /// </summary>
    [HttpPatch("api/deals/{dealId:guid}/done")]
    [ProducesResponseType(typeof(DealResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkDone([FromRoute] Guid dealId)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} marking deal {DealId} as done", callerId, dealId);

        var result = await _dealService.MarkDoneAsync(dealId, callerId);

        return Ok(result);
    }

    /// <summary>
    /// Returns the current Pending or Accepted deal for a conversation.
    /// Used to render the deal card in the chat UI. Returns 204 if none.
    /// </summary>
    [HttpGet("api/conversations/{conversationId:guid}/deals/active")]
    [ProducesResponseType(typeof(DealResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveDeal([FromRoute] Guid conversationId)
    {
        var callerId = User.GetBusinessId();

        var result = await _dealService.GetActiveDealAsync(conversationId, callerId);

        return result is null ? NoContent() : Ok(result);
    }

    /// <summary>
    /// Returns all deals for a product.
    /// Product owner sees all; buyers see only their own deals.
    /// Optionally filter by status (comma-separated, e.g. ?status=Pending,Accepted).
    /// </summary>
    [HttpGet("api/products/{productId:guid}/deals")]
    [ProducesResponseType(typeof(ProductDealsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductDeals(
        [FromRoute] Guid productId,
        [FromQuery] string? status)
    {
        var callerId = User.GetBusinessId();

        List<DealStatus>? statuses = null;

        if (!string.IsNullOrWhiteSpace(status))
        {
            statuses = status
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Enum.TryParse<DealStatus>(s, ignoreCase: true, out var parsed)
                    ? parsed
                    : (DealStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
        }

        var result = await _dealService.GetProductDealsAsync(productId, statuses, callerId);

        return Ok(result);
    }
}