using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductRepository : BaseRepository<Product>, IProductRepository
{
    private readonly ApplicationDbContext _context;
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<Product?> GetProductDetailsAsync(Guid productId)
    => await _context.Products
        .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
        .Include(p => p.Category)
        .Include(p => p.Owner)
        .Where(p => p.Id == productId && p.Status != ProductStatus.Deleted)
        .FirstOrDefaultAsync();
}