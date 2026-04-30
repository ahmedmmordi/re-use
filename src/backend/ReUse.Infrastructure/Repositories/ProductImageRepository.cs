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
}