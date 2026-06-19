using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ConversationRepository : BaseRepository<Conversation>, IConversationRepository
{
    private readonly ApplicationDbContext _context;

    public ConversationRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<Conversation?> GetByParticipantsAndProductAsync(
        Guid productId, Guid ownerId, Guid reactantId)
    {
        return await _context.Conversations
            .FirstOrDefaultAsync(c =>
                c.ProductId == productId &&
                c.OwnerId == ownerId &&
                c.ReactantId == reactantId &&
                c.IsActive &&
                c.Status == ConversationStatus.Active);
    }

    public async Task<List<Conversation>> GetByProductIdAsync(Guid productId)
    {
        return await _context.Conversations
            .Where(c =>
                c.IsActive &&
                c.Status == ConversationStatus.Active &&
                c.ProductId == productId)
            .ToListAsync();
    }

    public async Task<Conversation?> GetWithDetailsAsync(Guid conversationId)
    {
        return await _context.Conversations
            .Include(c => c.Owner)
            .Include(c => c.Reactant)
            .Include(c => c.Product)
                .ThenInclude(p => p.ProductImages.OrderBy(i => i.DisplayOrder).Take(1))
            .FirstOrDefaultAsync(c => c.Id == conversationId);
    }

    public async Task<PagedResult<ConversationProjection>> GetUserConversationsAsync(
    Guid userId, int pageNumber, int pageSize)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Where(c => c.ReactantId == userId || c.OwnerId == userId)
            .OrderByDescending(c => c.LastActivityAt)
            .Select(c => new ConversationProjection
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ProductTitle = c.Product.Title,
                ProductCoverImageUrl = c.Product.ProductImages
                                         .OrderBy(i => i.DisplayOrder)
                                         .Select(i => i.Url)
                                         .FirstOrDefault(),
                ProductStatus = c.Product.Status,
                ReactantId = c.ReactantId,
                ReactantName = c.Reactant.FullName,
                ReactantAvatarUrl = c.Reactant.ProfileImageUrl,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FullName,
                OwnerAvatarUrl = c.Owner.ProfileImageUrl,
                Status = c.Status,
                IsActive = c.IsActive,
                LastActivityAt = c.LastActivityAt,
                CreatedAt = c.CreatedAt,

                // Subquery: get the last non-fully-deleted message in one SQL call
                LastMessageType = c.Messages
                                       .Where(m => !(m.IsDeletedBySender && m.IsDeletedByReceiver))
                                       .OrderByDescending(m => m.SentAt)
                                       .Select(m => (MessageType?)m.MessageType)
                                       .FirstOrDefault(),

                LastMessagePreview = c.Messages
                                       .Where(m => !(m.IsDeletedBySender && m.IsDeletedByReceiver))
                                       .OrderByDescending(m => m.SentAt)
                                       .Select(m =>
                                           m.MessageType == MessageType.Text
                                               ? m.Content != null && m.Content.Length > 60
                                                   ? m.Content.Substring(0, 60) + "…"
                                                   : m.Content
                                           : m.MessageType == MessageType.Media
                                               ? "📷 Photo"
                                           : m.Content)
                                       .FirstOrDefault()
            })
            .ToPagedListAsync(pageNumber, pageSize);
    }

    public async Task<List<Conversation>> GetInactiveConversationsAsync(DateTime cutoff)
    {
        return await _context.Conversations
            .Where(c =>
                c.IsActive &&
                c.Status == ConversationStatus.Active &&
                c.LastActivityAt < cutoff)
            .ToListAsync();
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        var conversations = await _context.Conversations
       .Where(c => c.OwnerId == userId || c.ReactantId == userId)
       .ToListAsync();
        _context.Conversations.RemoveRange(conversations);
    }
}