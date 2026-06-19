using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Requests;
using ReUse.Application.DTOs.Chat.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IConversationService
{
    /// <summary>
    /// Opens a new conversation thread anchored to a product listing.
    /// ProductId comes from the route — a conversation cannot exist without a product.
    /// Throws ConflictException if a thread for this (product, caller) pair already exists.
    /// Throws BadRequestException if the product is not Active.
    /// Throws BadRequestException if the caller is the product owner (can't chat with yourself).
    /// </summary>
    Task<ConversationResponse> StartConversationAsync(
        Guid productId, StartConversationRequest request, Guid callerId);

    /// <summary>
    /// Returns conversation metadata + first page of messages in one call.
    /// Throws NotFoundException if the conversation does not exist.
    /// Throws ForbiddenException if the caller is not a participant.
    /// </summary>
    Task<ConversationDetailResponse> GetConversationAsync(
        Guid conversationId, Guid callerId);

    /// <summary>
    /// Returns all conversations for the caller (as buyer or seller),
    /// ordered by LastActivityAt descending.
    /// </summary>
    Task<PagedResult<ConversationResponse>> GetMyConversationsAsync(
        Guid callerId, PaginationParams pagination);

    /// <summary>
    /// Returns older messages for a conversation (used for infinite scroll).
    /// Throws ForbiddenException if the caller is not a participant.
    /// </summary>
    Task<PagedResult<MessageResponse>> GetMessagesAsync(
        Guid conversationId, PaginationParams pagination, Guid callerId);

    /// <summary>
    /// Sends a message inside an existing conversation.
    /// Enforces the WantedOffer offer-lock: seller cannot send a second Offer
    /// until the buyer responds to the current one.
    /// Updates LastActivityAt and fires a NewMessage notification to the receiver.
    /// Throws ForbiddenException if the conversation is not Active.
    /// </summary>
    Task<MessageResponse> SendMessageAsync(
        Guid conversationId, SendMessageRequest request, Guid senderId);

    /// <summary>
    /// Marks all unread messages in the conversation as Read.
    /// Returns the number of rows updated.
    /// Called by ChatHub.JoinConversation — also available as a REST fallback.
    /// </summary>
    Task<int> MarkAsReadAsync(Guid conversationId, Guid callerId);

    /// <summary>
    /// Soft-deletes a message for the caller's side only.
    /// When both sides delete, the message disappears from all queries permanently.
    /// Throws ForbiddenException if the caller is not a participant in the conversation.
    /// </summary>
    Task DeleteMessageAsync(Guid messageId, Guid callerId);

    /// <summary>
    /// Closes a conversation. Either participant can close.
    /// Sets Status = Closed and IsActive = false.
    /// Throws BadRequestException if already closed.
    /// </summary>
    Task CloseConversationAsync(Guid conversationId, Guid callerId);
}