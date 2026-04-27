using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductImageRepository : BaseRepository<ProductImage>, IProductImageRepository
{
    private readonly ApplicationDbContext _db;

    public ProductImageRepository(ApplicationDbContext db) : base(db)
    {
        _db = db;
    }

    public async Task<List<ProductImage>> GetByProductIdAsync(Guid productId)
    {
        return await _db.ProductImages
            .Where(x => x.ProductId == productId)
            .ToListAsync();
    }

    public async Task<int> CountByProductIdAsync(Guid productId)
    {
        return await _db.ProductImages
            .CountAsync(x => x.ProductId == productId);
    }
}