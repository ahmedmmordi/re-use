using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.Enums;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Extensions;

public static class ProductQueryExtensions
{
    // Search 

    ///Case-insensitive search across Title and Description
    public static IQueryable<Product> Search(
        this IQueryable<Product> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return query;

        var term = searchTerm.Trim().ToLower();

        return query.Where(p =>
            p.Title.ToLower().Contains(term) ||
            p.Description.ToLower().Contains(term));
    }

    //  Filters 

    /// Multi-select type filter. No-ops when list is null or empty.
    public static IQueryable<Product> FilterByTypes(
        this IQueryable<Product> query,
        List<ProductType>? types)
    {
        if (types is null || types.Count == 0)
            return query;

        return query.Where(p => types.Contains(p.ProductType));
    }

    ///Multi-select condition filter
    public static IQueryable<Product> FilterByConditions(
        this IQueryable<Product> query,
        List<ProductCondition>? conditions)
    {
        if (conditions is null || conditions.Count == 0)
            return query;

        return query.Where(p => p.Condition.HasValue && conditions.Contains(p.Condition.Value));
    }

    /// Matches products whose Category OR Subcategory equals the given id
    public static IQueryable<Product> FilterByCategory(
    this IQueryable<Product> query,
    Guid? categoryId)
    {
        if (!categoryId.HasValue)
            return query;

        return query.Where(p =>
            p.CategoryId == categoryId.Value ||                //subcategory
            p.Category.ParentId == categoryId.Value            // parent
        );
    }


    /// Price range filter.
    /// For Regular products: filters on Price.
    /// For Wanted products:  filters on MinPrice / MaxPrice range overlap.
    /// Swap products are excluded from price filtering when a range is set.

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

    /// <summary>Filters by LocationCity (case-insensitive exact match).</summary>
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

    ///// TODO : Filters out products whose seller rating is below the minimum
    //public static IQueryable<Product> FilterBySellerRating(
    //    this IQueryable<Product> query,
    //    double? minSellerRating)
    //{
    //    if (!minSellerRating.HasValue)
    //        return query;

    //    return query.Where(p => p.Seller.Rating >= minSellerRating.Value);
    //}

    //Sort

    public static IQueryable<Product> ApplySort(
     this IQueryable<Product> query,
     ProductSortBy sortBy,
     SortDirection direction)
    {
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

            _ => // Newest Desc (default)
                query.OrderByDescending(p => p.CreatedAt)
        };
    }
}