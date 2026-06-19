using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

using ReUse.API.Extensions;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Requests;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Hubs;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _conversationService;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(
        IConversationService conversationService,
        IHubContext<ChatHub> hubContext,
        ILogger<ConversationsController> logger)
    {
        _conversationService = conversationService;
        _hubContext = hubContext;
        _logger = logger;
    }

    // ── Start a conversation ─────────────────────────────────────────────────

    [HttpPost("api/products/{productId:guid}/conversations")]
    [ProducesResponseType(typeof(ConversationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> StartConversation(
        [FromRoute] Guid productId,
        [FromBody] StartConversationRequest request)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} starting conversation on product {ProductId}",
            callerId, productId);

        var result = await _conversationService
            .StartConversationAsync(productId, request, callerId);

        return CreatedAtAction(nameof(GetConversation),
            new { conversationId = result.Id }, result);
    }

    // ── My conversations ─────────────────────────────────────────────────────

    [HttpGet("api/me/conversations")]
    [ProducesResponseType(typeof(PagedResult<ConversationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyConversations([FromQuery] PaginationParams pagination)
    {
        var callerId = User.GetBusinessId();

        var result = await _conversationService
            .GetMyConversationsAsync(callerId, pagination);

        return Ok(result);
    }

    // ── Conversation detail ──────────────────────────────────────────────────

    [HttpGet("api/conversations/{conversationId:guid}")]
    [ProducesResponseType(typeof(ConversationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversation([FromRoute] Guid conversationId)
    {
        var callerId = User.GetBusinessId();

        var result = await _conversationService
            .GetConversationAsync(conversationId, callerId);

        return Ok(result);
    }

    // ── Messages (infinite scroll) ───────────────────────────────────────────

    [HttpGet("api/conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(PagedResult<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(
        [FromRoute] Guid conversationId,
        [FromQuery] PaginationParams pagination)
    {
        var callerId = User.GetBusinessId();

        var result = await _conversationService
            .GetMessagesAsync(conversationId, pagination, callerId);

        return Ok(result);
    }

    // ── Send message ─────────────────────────────────────────────────────────

    [HttpPost("api/conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage(
        [FromRoute] Guid conversationId,
        [FromForm] SendMessageRequest request)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} sending {MessageType} in conversation {ConversationId}",
            callerId, request.MessageType, conversationId);

        // Save to DB — this always succeeds or throws (handled by ExceptionMiddleware)
        var result = await _conversationService
            .SendMessageAsync(conversationId, request, callerId);


        await PushToConversationExcludingSender(
            conversationId, callerId, "ReceiveMessage", result);

        return CreatedAtAction(nameof(GetMessages), new { conversationId }, result);
    }

    // ── Mark as read (REST fallback) ─────────────────────────────────────────

    [HttpPatch("api/conversations/{conversationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead([FromRoute] Guid conversationId)
    {
        var callerId = User.GetBusinessId();
        await _conversationService.MarkAsReadAsync(conversationId, callerId);
        return NoContent();
    }

    // ── Delete message ───────────────────────────────────────────────────────

    [HttpDelete("api/conversations/messages/{messageId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMessage([FromRoute] Guid messageId)
    {
        var callerId = User.GetBusinessId();
        await _conversationService.DeleteMessageAsync(messageId, callerId);
        return NoContent();
    }

    // ── Close conversation ───────────────────────────────────────────────────

    [HttpPatch("api/conversations/{conversationId:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseConversation([FromRoute] Guid conversationId)
    {
        var callerId = User.GetBusinessId();

        _logger.LogInformation(
            "User {CallerId} closing conversation {ConversationId}",
            callerId, conversationId);

        await _conversationService.CloseConversationAsync(conversationId, callerId);
        return NoContent();
    }

    // ── Private helper ───────────────────────────────────────────────────────

    /// <summary>
    /// Pushes a SignalR event to all connections in a conversation group
    /// EXCEPT the sender's own connections (to avoid duplicate rendering).
    ///
    /// Uses real connection IDs from ChatHub.GetConnectionIds() — NOT a group name —
    /// because IHubContext.GroupExcept() requires connection IDs, not group names.
    ///
    /// Failures are logged and swallowed so a SignalR outage never causes
    /// a successfully-persisted message to return HTTP 500.
    /// </summary>
    private async Task PushToConversationExcludingSender(
        Guid conversationId, Guid senderId, string eventName, object payload)
    {
        try
        {
            // Get the sender's current connection IDs from the in-memory tracker
            var senderConnectionIds = ChatHub.GetConnectionIds(senderId);

            await _hubContext.Clients
                .GroupExcept(ChatHub.ConversationGroup(conversationId), senderConnectionIds)
                .SendAsync(eventName, payload);
        }
        catch (Exception ex)
        {
            // Log but do NOT rethrow — the DB write already succeeded
            _logger.LogWarning(ex,
                "SignalR push failed for event {Event} in conversation {ConversationId}. " +
                "Message was persisted successfully.",
                eventName, conversationId);
        }
    }
}