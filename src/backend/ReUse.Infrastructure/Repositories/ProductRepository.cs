using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductRepository : BaseRepository<Product>, IProductRepository
{
    private readonly ApplicationDbContext _context;
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    #region GetProductDetailsAsync
    public async Task<Product?> GetProductDetailsAsync(Guid productId)
=> await _context.Products
   .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
   .Include(p => p.Category)
   .Include(p => p.Owner)
   .Where(p => p.Id == productId && p.Status != ProductStatus.Deleted)
   .FirstOrDefaultAsync();
    #endregion

    #region GetAllAsync
    public async Task<PagedResult<Product>> GetAllAsync(ProductFilterParams filterParams)
=> await _context.Products
   .AsNoTracking()
   .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
   .Include(p => p.Owner)
   .Where(p => p.Status == ProductStatus.Active)
   .Search(filterParams.SearchTerm)
   .FilterByTypes(filterParams.Types)
   .FilterByConditions(filterParams.Conditions)
   .FilterByCategory(filterParams.CategoryId)
   .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
   .FilterByLocation(filterParams.Location)
   //.FilterBySellerRating(filterParams.MinSellerRating)
   .ApplySort(filterParams.SortBy, filterParams.SortDirection)
   .ToPagedListAsync(
       filterParams.Pagination.PageNumber,
       filterParams.Pagination.PageSize);
    #endregion
}