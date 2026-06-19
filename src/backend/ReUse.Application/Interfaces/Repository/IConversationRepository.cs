using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Repository;

public interface IConversationRepository : IBaseRepository<Conversation>
{
    Task<Conversation?> GetByParticipantsAndProductAsync(
        Guid productId, Guid ownerId, Guid reactantId);

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

    Task<List<Conversation>> GetInactiveConversationsAsync(DateTime cutoff);

    Task DeleteByUserIdAsync(Guid userId);

    Task<List<Conversation>> GetByProductIdAsync(Guid productId);
}