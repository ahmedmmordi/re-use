using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductImageRepository : BaseRepository<ProductImage>, IProductImageRepository
{
    private readonly ApplicationDbContext _context;

    public ProductImageRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<List<ProductImage>> GetByProductIdAsync(Guid productId)
    {
        return await _context.ProductImages
            .Where(x => x.ProductId == productId)
            .ToListAsync();
    }

    public async Task<int> CountByProductIdAsync(Guid productId)
    {
        return await _context.ProductImages
            .CountAsync(x => x.ProductId == productId);
    }

    public async Task<List<ProductImage>> GetByPublicIdsAsync(IEnumerable<string> publicIds)
    {
        if (publicIds is null || !publicIds.Any())
            return new List<ProductImage>();

        return await _context.ProductImages
            .Where(x => publicIds.Contains(x.PublicId))
            .ToListAsync();
    }

    public async Task<List<ProductImage>> GetByIdsAsync(IEnumerable<Guid> ids)
    {
        return await _context.ProductImages
            .Where(x => ids.Contains(x.Id))
            .ToListAsync();
    }
}