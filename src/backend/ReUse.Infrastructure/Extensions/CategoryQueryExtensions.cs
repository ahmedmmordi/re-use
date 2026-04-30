using ReUse.Application.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Extensions;

public static class CategoryQueryExtensions
{
    public static IQueryable<Category> ApplySort(
        this IQueryable<Category> query,
        CategoriesSortBy sortBy,
        SortDirection sortOrder)
    {
        var isDescending = sortOrder == SortDirection.Desc;

        // Map sorting field names
        query = sortBy switch
        {
            CategoriesSortBy.Name => isDescending
                ? query.OrderByDescending(c => c.Name)
                : query.OrderBy(c => c.Name),

            CategoriesSortBy.IsActive => isDescending
                ? query.OrderByDescending(c => c.IsActive)
                : query.OrderBy(c => c.IsActive),

            CategoriesSortBy.CreatedAt => isDescending
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt),

            CategoriesSortBy.UpdatedAt => isDescending
                ? query.OrderByDescending(c => c.UpdatedAt)
                : query.OrderBy(c => c.UpdatedAt),

            // Default: sort by CreatedAt desc
            _ => query.OrderByDescending(c => c.CreatedAt)
        };

        return query;
    }

    public static IQueryable<Category> Search(
        this IQueryable<Category> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return query;

        var lowerSearchTerm = searchTerm.Trim().ToLower();

        return query.Where(c =>
            c.Name.ToLower().Contains(lowerSearchTerm) ||
            c.Description!.ToLower().Contains(lowerSearchTerm)
        );
    }

    public static IQueryable<Category> FilterByParent(
        this IQueryable<Category> query,
        Guid? parentId)
    {
        if (parentId == null)
            return query;

        return query.Where(c => c.ParentId == parentId);
    }

    public static IQueryable<Category> FilterByActive(
        this IQueryable<Category> query,
        bool? isActive)
    {
        if (!isActive.HasValue)
            return query;

        return query.Where(c => c.IsActive == isActive.Value);
    }
}