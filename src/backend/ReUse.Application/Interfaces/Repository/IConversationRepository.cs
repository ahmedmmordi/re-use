using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Repository;

public interface IConversationRepository : IBaseRepository<Conversation>
{
    Task<Conversation?> GetByParticipantsAndProductAsync(
        Guid productId, Guid buyerId, Guid sellerId);

    /// <summary>
    /// Returns a conversation with participants and product loaded.
    /// Does NOT load Messages — preview is not needed for detail view.
    /// </summary>
    Task<Conversation?> GetWithDetailsAsync(Guid conversationId);

    /// <summary>
    /// Returns all conversations for a user as flat projections.
    /// LastMessagePreview is computed in SQL — no nav collection access.
    /// </summary>
    Task<PagedResult<ConversationProjection>> GetUserConversationsAsync(
        Guid userId, int pageNumber, int pageSize);

    Task<bool> HasPendingOfferAsync(Guid conversationId, Guid sellerId);

    Task<List<Conversation>> GetInactiveConversationsAsync(DateTime cutoff);

    Task<List<Conversation>> GetByProductIdAsync(Guid productId);
}