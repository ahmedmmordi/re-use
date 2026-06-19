using ReUse.Application.DTOs;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IMessageRepository : IBaseRepository<Message>
{
    /// <summary>
    /// Returns messages for a conversation ordered by SentAt ascending (oldest first).
    /// Excludes messages where both IsDeletedBySender and IsDeletedByReceiver are true.
    /// </summary>
    Task<PagedResult<Message>> GetConversationMessagesAsync(
        Guid conversationId, Guid viewerId, int pageNumber, int pageSize);

    /// <summary>
    /// Returns the count of messages in this conversation where ReadAt is null
    /// and the sender is NOT the reader — i.e. unread messages waiting for this user.
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid conversationId, Guid readerId);

    /// <summary>
    /// Bulk-sets ReadAt = now on all unread messages sent to readerId in this conversation.
    /// Returns the number of rows updated so the service knows whether to broadcast a receipt.
    /// </summary>
    Task<int> MarkConversationAsReadAsync(Guid conversationId, Guid readerId);

}