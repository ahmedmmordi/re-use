using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class FavoriteRepository : BaseRepository<Favorite>, IFavoriteRepository
{
    private readonly ApplicationDbContext _context;

    public FavoriteRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<bool> IsFavoritedAsync(Guid userId, Guid productId)
        => await _context.Favorites
            .AnyAsync(f => f.UserId == userId && f.ProductId == productId);

    public async Task<Favorite?> GetFavoriteAsync(Guid userId, Guid productId)
        => await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);

    public async Task<PagedResult<Product>> GetUserFavoriteProductsAsync(
         Guid userId,
         ProductFilterParams filterParams)
    {
        var favoritedProductIds = _context.Favorites
            .Where(f => f.UserId == userId)
            .Select(f => f.ProductId);

        return await _context.Products
            .AsNoTracking()
            .Include(p => p.ProductImages.OrderBy(i => i.DisplayOrder))
            .Include(p => p.Owner)
            .Where(p => favoritedProductIds.Contains(p.Id) && p.Status == ProductStatus.Active)
            .Search(filterParams.SearchTerm)
            .FilterByTypes(filterParams.Types)
            .FilterByConditions(filterParams.Conditions)
            .FilterByPremium(filterParams.IsPremium)
            .FilterByCategories(filterParams.CategoryIds)
            .FilterByPrice(filterParams.MinPrice, filterParams.MaxPrice)
            .FilterByLocation(filterParams.Location)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(
                filterParams.Pagination.PageNumber,
                filterParams.Pagination.PageSize);
    }
}