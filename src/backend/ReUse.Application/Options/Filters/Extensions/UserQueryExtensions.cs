using Microsoft.EntityFrameworkCore;

using ReUse.Application.Options.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Application.Options.Filters.Extensions;

public static class UserQueryExtensions
{
    public static IQueryable<User> ApplyFilter(
        this IQueryable<User> query,
        UserFilterOptions? filter)
    {
        if (filter is null)
            return query;

        if (!string.IsNullOrWhiteSpace(filter.Country))
        {
            var country = filter.Country.Trim();
            query = query.Where(u =>
                u.Country != null &&
                EF.Functions.Like(u.Country, $"%{country}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            var city = filter.City.Trim();
            query = query.Where(u =>
                u.City != null &&
                EF.Functions.Like(u.City, $"%{city}%"));
        }

        if (filter.CreatedAfter.HasValue)
        {
            query = query.Where(u =>
                u.CreatedAt >= filter.CreatedAfter.Value);
        }

        return query;
    }

    public static IQueryable<User> ApplySearch(
        this IQueryable<User> query,
        string? keyword,
        IReadOnlyList<UserSearchBy>? filterBy = null)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return query;

        var term = $"%{keyword.Trim()}%";

        var fields = (filterBy is { Count: > 0 }
                ? filterBy
                : Enum.GetValues<UserSearchBy>())
            .ToHashSet();

        var searchEmail = fields.Contains(UserSearchBy.Email);
        var searchName = fields.Contains(UserSearchBy.FullName);

        return query.Where(u =>
            (searchEmail &&
             u.Email != null &&
             EF.Functions.Like(u.Email, term)) ||

            (searchName &&
             u.FullName != null &&
             EF.Functions.Like(u.FullName, term))
        );
    }

    public static IQueryable<User> ApplySort(
        this IQueryable<User> query,
        UserSortBy sortBy,
        SortDirection direction)
    {
        var isDesc = direction == SortDirection.Desc;

        return sortBy switch
        {
            UserSortBy.FullName => isDesc
                ? query.OrderByDescending(u => u.FullName ?? "")
                       .ThenByDescending(u => u.Id)
                : query.OrderBy(u => u.FullName ?? "")
                       .ThenBy(u => u.Id),

            UserSortBy.Email => isDesc
                ? query.OrderByDescending(u => u.Email ?? "")
                       .ThenByDescending(u => u.Id)
                : query.OrderBy(u => u.Email ?? "")
                       .ThenBy(u => u.Id),

            UserSortBy.CreatedAt => isDesc
                ? query.OrderByDescending(u => u.CreatedAt)
                       .ThenByDescending(u => u.Id)
                : query.OrderBy(u => u.CreatedAt)
                       .ThenBy(u => u.Id),

            _ => isDesc
                ? query.OrderByDescending(u => u.CreatedAt)
                       .ThenByDescending(u => u.Id)
                : query.OrderBy(u => u.CreatedAt)
                       .ThenBy(u => u.Id)
        };
    }

    //  pipeline method clean usage
    public static IQueryable<User> ApplyQuery(
        this IQueryable<User> query,
        UserFilterOptions? filter,
        string? keyword,
        IReadOnlyList<UserSearchBy>? searchBy,
        UserSortBy sortBy,
        SortDirection direction)
    {
        return query
            .ApplyFilter(filter)
            .ApplySearch(keyword, searchBy)
            .ApplySort(sortBy, direction);
    }
}