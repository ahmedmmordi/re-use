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
        Guid productId, Guid buyerId, Guid sellerId)
    {
        return await _context.Conversations
            .FirstOrDefaultAsync(c =>
                c.ProductId == productId &&
                c.BuyerId == buyerId &&
                c.SellerId == sellerId);
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
            .Include(c => c.Buyer)
            .Include(c => c.Seller)
            .Include(c => c.Product)
                .ThenInclude(p => p.ProductImages.OrderBy(i => i.DisplayOrder).Take(1))
            .FirstOrDefaultAsync(c => c.Id == conversationId);
    }

    public async Task<PagedResult<ConversationProjection>> GetUserConversationsAsync(
    Guid userId, int pageNumber, int pageSize)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Where(c => c.BuyerId == userId || c.SellerId == userId)
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
                BuyerId = c.BuyerId,
                BuyerName = c.Buyer.FullName,
                BuyerAvatarUrl = c.Buyer.ProfileImageUrl,
                SellerId = c.SellerId,
                SellerName = c.Seller.FullName,
                SellerAvatarUrl = c.Seller.ProfileImageUrl,
                ConversationType = c.ConversationType,
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
                                           : m.MessageType == MessageType.Offer
                                               ? "💰 Offer sent"
                                           : m.MessageType == MessageType.OfferAccepted
                                               ? "✅ Offer accepted"
                                           : m.MessageType == MessageType.OfferDeclined
                                               ? "❌ Offer declined"
                                           : m.Content)
                                       .FirstOrDefault()
            })
            .ToPagedListAsync(pageNumber, pageSize);
    }

    public async Task<bool> HasPendingOfferAsync(Guid conversationId, Guid sellerId)
    {
        // Find the most recent Offer sent by the seller in this conversation
        var lastOffer = await _context.Messages
            .Where(m =>
                m.ConversationId == conversationId &&
                m.SenderId == sellerId &&
                m.MessageType == MessageType.Offer)
            .OrderByDescending(m => m.SentAt)
            .FirstOrDefaultAsync();

        // No offer ever sent — seller is free to send one
        if (lastOffer is null) return false;

        // Check if the buyer responded after that offer
        // Any OfferAccepted or OfferDeclined message that came after it means it is resolved
        var isResolved = await _context.Messages
            .AnyAsync(m =>
                m.ConversationId == conversationId &&
                m.SentAt > lastOffer.SentAt &&
                (m.MessageType == MessageType.OfferAccepted ||
                 m.MessageType == MessageType.OfferDeclined));

        // Pending = offer exists but has NOT been resolved yet
        return !isResolved;
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
}