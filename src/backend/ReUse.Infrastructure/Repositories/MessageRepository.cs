using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class MessageRepository : BaseRepository<Message>, IMessageRepository
{
    private readonly ApplicationDbContext _context;

    public MessageRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<PagedResult<Message>> GetConversationMessagesAsync(
        Guid conversationId, Guid viewerId, int pageNumber, int pageSize)
    {
        // Viewer-aware filter applied IN SQL before paging.
        //
        // Rules:
        //   Exclude the row if: viewer is the sender   AND IsDeletedBySender   = true
        //   Exclude the row if: viewer is the receiver AND IsDeletedByReceiver = true
        //
        // When both flags are true the row is excluded for everyone (fully deleted).
        // When only one flag is true, the other participant still sees the message.
        //
        // This guarantees correct page composition — the viewer never gets a page
        // that's partially filled due to post-query filtering.
        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m =>
                m.ConversationId == conversationId &&
                !(m.SenderId == viewerId && m.IsDeletedBySender) &&
                !(m.SenderId != viewerId && m.IsDeletedByReceiver))
            .OrderByDescending(m => m.SentAt)
            .ToPagedListAsync(pageNumber, pageSize);
    }

    public async Task<int> GetUnreadCountAsync(Guid conversationId, Guid readerId)
        => await _context.Messages
            .CountAsync(m =>
                m.ConversationId == conversationId &&
                m.SenderId != readerId &&
                !m.IsDeletedByReceiver &&
                m.ReadAt == null);

    public async Task<int> MarkConversationAsReadAsync(Guid conversationId, Guid readerId)
        => await _context.Messages
            .Where(m =>
                m.ConversationId == conversationId &&
                m.SenderId != readerId &&
                !m.IsDeletedByReceiver &&
                m.ReadAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.ReadAt, DateTime.UtcNow)
                .SetProperty(m => m.DeliveredAt,
                    m => m.DeliveredAt == null ? DateTime.UtcNow : m.DeliveredAt));

}