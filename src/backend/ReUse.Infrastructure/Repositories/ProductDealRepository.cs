using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductDealRepository : BaseRepository<ProductDeal>, IProductDealRepository
{
    private readonly ApplicationDbContext _context;

    public ProductDealRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<ProductDeal?> GetActiveByConversationIdAsync(Guid conversationId)
    {
        return await _context.ProductDeals
            .Include(d => d.Proposer)
            .Include(d => d.Receiver)
            .Where(d => d.ConversationId == conversationId &&
                        (d.Status == DealStatus.Accepted || d.Status == DealStatus.Pending))
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ProductDeal>> GetByProductIdAsync(Guid productId, List<DealStatus>? statuses = null)
    {
        var query = _context.ProductDeals
            .Include(d => d.Proposer)
            .Include(d => d.Receiver)
            .Where(d => d.ProductId == productId);

        if (statuses != null && statuses.Any())
        {
            query = query.Where(d => statuses.Contains(d.Status));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ProductDeal>> GetByProductIdForUserAsync(Guid userId, Guid productId, List<DealStatus>? statuses = null)
    {
        var query = _context.ProductDeals
            .Include(d => d.Proposer)
            .Include(d => d.Receiver)
            .Where(d => d.ProductId == productId && (d.ProposerId == userId || d.ReceiverId == userId));

        if (statuses != null && statuses.Any())
        {
            query = query.Where(d => statuses.Contains(d.Status));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }
}