using ReUse.Application.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Extensions;

public static class UserQueryExtensions
{
    public static IQueryable<User> ApplySort(
        this IQueryable<User> query,
        UserSortBy sortBy,
        SortDirection sortOrder)
    {
        var isDescending = sortOrder == SortDirection.Desc;

        // Map sorting field names
        query = sortBy switch
        {
            UserSortBy.FullName => isDescending
                ? query.OrderByDescending(u => u.FullName)
                : query.OrderBy(u => u.FullName),

            UserSortBy.Email => isDescending
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),

            UserSortBy.CreatedAt => isDescending
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt),

            // Default: sort by CreatedAt desc
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        return query;
    }

    public static IQueryable<User> Search(
        this IQueryable<User> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return query;

        var lowerSearchTerm = searchTerm.Trim().ToLower();

        return query.Where(u =>
            u.FullName.ToLower().Contains(lowerSearchTerm) ||
            u.Email.ToLower().Contains(lowerSearchTerm)
        );
    }

    public static IQueryable<User> FilterByCity(
        this IQueryable<User> query,
        string? city)
    {
        if (string.IsNullOrWhiteSpace(city))
            return query;

        return query.Where(u => u.City == city);
    }

    public static IQueryable<User> FilterByCountry(
        this IQueryable<User> query,
        string? country)
    {
        if (string.IsNullOrWhiteSpace(country))
            return query;

        return query.Where(u => u.Country == country);
    }

    public static IQueryable<User> FilterByStateProvince(
        this IQueryable<User> query,
        string? stateProvince)
    {
        if (string.IsNullOrWhiteSpace(stateProvince))
            return query;

        return query.Where(u => u.StateProvince == stateProvince);
    }

    public static IQueryable<User> FilterByActive(
        this IQueryable<User> query,
        bool? isActive)
    {
        if (!isActive.HasValue)
            return query;

        return query.Where(u => u.IsActive == isActive.Value);
    }

    public static IQueryable<User> FilterByCreatedDate(
        this IQueryable<User> query,
        DateTime? createdAfter,
        DateTime? createdBefore)
    {
        if (createdAfter.HasValue)
            query = query.Where(u => u.CreatedAt >= createdAfter.Value);

        if (createdBefore.HasValue)
            query = query.Where(u => u.CreatedAt <= createdBefore.Value);

        return query;
    }
}