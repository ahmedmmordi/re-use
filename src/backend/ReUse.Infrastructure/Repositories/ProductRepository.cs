using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Responses;
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
   .Where(p => p.Category.IsActive && (p.Category.Parent == null || p.Category.Parent.IsActive))
   .Search(filterParams.SearchTerm)
   .FilterByTypes(filterParams.Types)
   .FilterByConditions(filterParams.Conditions)
   .FilterByCategories(filterParams.CategoryIds)
   .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
   .FilterByLocation(filterParams.Location)
   //.FilterBySellerRating(filterParams.MinSellerRating)
   .ApplySort(filterParams.SortBy, filterParams.SortDirection)
   .ToPagedListAsync(
       filterParams.Pagination.PageNumber,
       filterParams.Pagination.PageSize);
    #endregion

    #region GetActiveCountsByCategoryAsync
    public async Task<Dictionary<Guid, int>> GetActiveCountsByCategoryAsync()
        => await _context.Products
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active)
            .Where(p => p.Category.IsActive && (p.Category.Parent == null || p.Category.Parent.IsActive))
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);
    #endregion

    #region GetActiveCountForCategoryAsync
    public async Task<int> GetActiveCountForCategoryAsync(Guid categoryId)
        => await _context.Products
            .AsNoTracking()
            .CountAsync(p => p.Status == ProductStatus.Active
                          && p.CategoryId == categoryId
                          && p.Category.IsActive
                          && (p.Category.Parent == null || p.Category.Parent.IsActive));
    #endregion

    #region GetMyListingsAsync
    public async Task<PagedResult<Product>> GetMyListingsAsync(
        Guid ownerId,
        MyListingsParams filterParams)
        => await _context.Products
            .AsNoTracking()
            .Include(p => p.ProductImages)
            .Include(p => p.Owner)
            .Where(p => p.OwnerUserId == ownerId)
            .FilterByStatus(filterParams.Status)   // seller only
            .Search(filterParams.SearchTerm)
            .FilterByTypes(filterParams.Types)
            .FilterByConditions(filterParams.Conditions)
            .FilterByCategories(filterParams.CategoryIds)
            .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
            .FilterByLocation(filterParams.Location)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(
                filterParams.Pagination.PageNumber,
                filterParams.Pagination.PageSize);
    #endregion

    #region GetSellerSummaryAsync
    public async Task<SellerSummary> GetSellerSummaryAsync(Guid ownerId)
    {
        var counts = await _context.Products
            .AsNoTracking()
            .Where(p => p.OwnerUserId == ownerId)
            .GroupBy(_ => 1)                     // singlepass aggregation
            .Select(g => new SellerSummary(
                g.Count(),
                g.Count(p => p.Status == ProductStatus.Active),
                g.Count(p => p.Status == ProductStatus.Sold)))
            .FirstOrDefaultAsync();

        return counts ?? new SellerSummary(0, 0, 0);
    }
    #endregion

    #region GetPublicProductsByUserAsync
    public async Task<PagedResult<Product>> GetPublicProductsByUserAsync(
        Guid ownerId,
        ProductFilterParams filterParams)
        => await _context.Products
            .AsNoTracking()
            .Include(p => p.ProductImages)
            .Include(p => p.Owner)
            .Where(p => p.OwnerUserId == ownerId
                     && p.Status == ProductStatus.Active)
            .Search(filterParams.SearchTerm)
            .FilterByTypes(filterParams.Types)
            .FilterByConditions(filterParams.Conditions)
            .FilterByCategories(filterParams.CategoryIds)
            .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
            .FilterByLocation(filterParams.Location)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(
                filterParams.Pagination.PageNumber,
                filterParams.Pagination.PageSize);
    #endregion

    #region GetAllForAdminAsync
    public async Task<PagedResult<Product>> GetAllForAdminAsync(AdminProductFilterParams filterParams)
        => await _context.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
            .Include(p => p.Category)
            .Include(p => p.Owner)
            .Include(p => p.Favorites)
            .FilterByStatuses(filterParams.Statuses)
            .FilterByOwner(filterParams.OwnerUserId)
            .FilterByDateRange(filterParams.CreatedFrom, filterParams.CreatedTo)
            .Search(filterParams.SearchTerm)
            .FilterByTypes(filterParams.Types)
            .FilterByConditions(filterParams.Conditions)
            .FilterByCategories(filterParams.CategoryIds)
            .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
            .FilterByLocation(filterParams.Location)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(
                filterParams.Pagination.PageNumber,
                filterParams.Pagination.PageSize);
    #endregion

    #region GetForAdminByIdAsync
    public async Task<Product?> GetForAdminByIdAsync(Guid productId)
        => await _context.Products
            .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
            .Include(p => p.Category)
            .Include(p => p.Owner)
            .FirstOrDefaultAsync(p => p.Id == productId);
    #endregion

    #region GetAdminSummaryAsync
    public async Task<AdminProductsSummary> GetAdminSummaryAsync()
    {
        var counts = await _context.Products
            .AsNoTracking()
            .GroupBy(_ => 1)                     // single-pass aggregation
            .Select(g => new AdminProductsSummary(
                g.Count(),
                g.Count(p => p.Status == ProductStatus.Active),
                g.Count(p => p.Status == ProductStatus.Sold),
                g.Count(p => p.Status == ProductStatus.Closed),
                g.Count(p => p.Status == ProductStatus.Deleted),
                g.Count(p => p.Status == ProductStatus.UnderReview)))
            .FirstOrDefaultAsync();

        return counts ?? new AdminProductsSummary(0, 0, 0, 0, 0, 0);
    }
    #endregion
}