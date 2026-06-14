using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductDealRepository : BaseRepository<ProductDeal>, IProductDealRepository
{
    private readonly ApplicationDbContext _context;

    public ProductDealRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<List<ProductDeal>> GetByUserIdAsync(Guid userId)
    {
        return await _context.ProductDeals
            .Where(pd => pd.BuyerId == userId || pd.SellerId == userId)
            .ToListAsync();
    }

    public async Task<bool> ExistsByConversationIdAsync(Guid conversationId)
    {
        return await _context.ProductDeals
            .AnyAsync(pd => pd.ConversationId == conversationId);
    }
}