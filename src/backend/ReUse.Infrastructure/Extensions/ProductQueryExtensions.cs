using ReUse.Application.Enums;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Extensions;

public static class ProductQueryExtensions
{
    // Search

    /// Case-insensitive search across product, category, seller, location, and swap-request fields.
    public static IQueryable<Product> Search(
        this IQueryable<Product> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return query;

        var term = searchTerm.Trim().ToLower();
        return query.Where(p =>
            p.Title.ToLower().Contains(term) ||
            p.Description.ToLower().Contains(term) ||
            p.Category.Name.ToLower().Contains(term) ||
            (p.Category.Description != null && p.Category.Description.ToLower().Contains(term)) ||
            (p is SwapProduct &&
                (((SwapProduct)p).WantedItemTitle.ToLower().Contains(term) ||
                 (((SwapProduct)p).WantedItemDescription != null &&
                  ((SwapProduct)p).WantedItemDescription!.ToLower().Contains(term))))
        );
    }

    // Filters

    /// Multi-select type filter. No-ops when list is null or empty.
    public static IQueryable<Product> FilterByTypes(
        this IQueryable<Product> query,
        List<ProductType>? types)
    {
        if (types is null || types.Count == 0)
            return query;

        return query.Where(p => types.Contains(p.ProductType));
    }

    /// Multi-select condition filter
    public static IQueryable<Product> FilterByConditions(
        this IQueryable<Product> query,
        List<ProductCondition>? conditions)
    {
        if (conditions is null || conditions.Count == 0)
            return query;

        return query.Where(p => p.Condition.HasValue && conditions.Contains(p.Condition.Value));
    }

    /// Premium-only filter. No-ops when value is null.
    public static IQueryable<Product> FilterByPremium(
        this IQueryable<Product> query,
        bool? isPremium)
    {
        if (!isPremium.HasValue)
            return query;

        return query.Where(p => p.IsPremium == isPremium.Value);
    }

    /// Matches products whose Category OR Subcategory equals the given id
    public static IQueryable<Product> FilterByCategories(
        this IQueryable<Product> query,
        List<Guid>? categoryIds)
    {
        if (categoryIds is null || categoryIds.Count == 0)
            return query;

        return query.Where(p =>
            categoryIds.Contains(p.CategoryId) ||
            (p.Category.ParentId.HasValue && categoryIds.Contains(p.Category.ParentId.Value))
        );
    }

    /// Price range filter.
    public static IQueryable<Product> FilterByPrice(
        this IQueryable<Product> query,
        decimal? minPrice,
        decimal? maxPrice)
    {
        if (!minPrice.HasValue && !maxPrice.HasValue)
            return query;

        return query.Where(p =>
            (p is RegularProduct &&
                (!minPrice.HasValue || ((RegularProduct)p).Price >= minPrice.Value) &&
                (!maxPrice.HasValue || ((RegularProduct)p).Price <= maxPrice.Value))
            ||
            (p is WantedProduct &&
                (!minPrice.HasValue || ((WantedProduct)p).DesiredPriceMax >= minPrice.Value) &&
                (!maxPrice.HasValue || ((WantedProduct)p).DesiredPriceMin <= maxPrice.Value)));
    }

    /// Filters by LocationCity (case-insensitive exact match).
    public static IQueryable<Product> FilterByLocation(
        this IQueryable<Product> query,
        string? location)
    {
        if (string.IsNullOrWhiteSpace(location))
            return query;

        var term = location.Trim().ToLower();

        return query.Where(p =>
            (p.LocationCity != null && p.LocationCity.ToLower().Contains(term)) ||
            (p.LocationCountry != null && p.LocationCountry.ToLower().Contains(term))
        );
    }

    // Sort

    public static IQueryable<Product> ApplySort(
        this IQueryable<Product> query,
        ProductSortBy sortBy,
        SortDirection direction,
        string? searchTerm = null)
    {
        if (sortBy == ProductSortBy.Relevance && !string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();

            return query
                .OrderByDescending(p => p.Title.ToLower() == term)
                .ThenByDescending(p => p.Title.ToLower().StartsWith(term))
                .ThenByDescending(p => p.Title.ToLower().Contains(term))
                .ThenByDescending(p => p.Category.Name.ToLower().Contains(term))
                .ThenByDescending(p => p.Description.ToLower().Contains(term))
                .ThenByDescending(p =>
                    p is SwapProduct &&
                    (((SwapProduct)p).WantedItemTitle.ToLower().Contains(term) ||
                     (((SwapProduct)p).WantedItemDescription != null &&
                      ((SwapProduct)p).WantedItemDescription!.ToLower().Contains(term))))
                .ThenByDescending(p => p.IsPremium)
                .ThenByDescending(p => p.CreatedAt);
        }

        return (sortBy, direction) switch
        {
            (ProductSortBy.Price, SortDirection.Asc) =>
                query.OrderBy(p =>
                    p is RegularProduct
                        ? ((RegularProduct)p).Price
                        : p is WantedProduct
                            ? ((WantedProduct)p).DesiredPriceMin
                            : 0),

            (ProductSortBy.Price, SortDirection.Desc) =>
                query.OrderByDescending(p =>
                    p is RegularProduct
                        ? ((RegularProduct)p).Price
                        : p is WantedProduct
                            ? ((WantedProduct)p).DesiredPriceMin
                            : 0),

            (ProductSortBy.Newest, SortDirection.Asc) =>
                query.OrderBy(p => p.CreatedAt),

            (ProductSortBy.Recommended, _) =>
                query,  // No SQL ordering — RankingEngine applies in-memory sort after candidate scoring

            _ => // Newest Desc (default)
                query.OrderByDescending(p => p.CreatedAt)
        };
    }

    public static IQueryable<Product> FilterByStatus(
        this IQueryable<Product> query,
        ProductStatus? status)
    {
        if (!status.HasValue)
            return query;

        return query.Where(p => p.Status == status.Value);
    }

    /// Filters by owner user id. No-ops when ownerId is null.
    public static IQueryable<Product> FilterByOwner(
        this IQueryable<Product> query,
        Guid? ownerId)
    {
        if (!ownerId.HasValue || ownerId.Value == Guid.Empty)
            return query;

        return query.Where(p => p.OwnerUserId == ownerId.Value);
    }

    /// Multi-select status filter. No-ops when list is null or empty.
    public static IQueryable<Product> FilterByStatuses(
        this IQueryable<Product> query,
        List<ProductStatus>? statuses)
    {
        if (statuses is null || statuses.Count == 0)
            return query;

        return query.Where(p => statuses.Contains(p.Status));
    }

    /// Filters by CreatedAt date range (inclusive). No-ops when both bounds are null.
    public static IQueryable<Product> FilterByDateRange(
        this IQueryable<Product> query,
        DateTime? from,
        DateTime? to)
    {
        if (!from.HasValue && !to.HasValue)
            return query;

        if (from.HasValue)
            query = query.Where(p => p.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(p => p.CreatedAt <= to.Value);

        return query;
    }
}