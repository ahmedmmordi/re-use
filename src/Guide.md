# Pagination Guide

## 1st step: create Enum of sorting options
in enums folder `re-use/src/backend/ReUse.Application/Enums/` create a file named <Name>SortBy.cs
Like this:
```csharp
public enum UserSortBy
{
    FullName,
    CreatedAt,
    Email
}
```
## 2st step: create FilterParams
in DTOs folder `re-use/src/backend/ReUse.Application/DTOs/` create a file named <Name>FilterParams.cs
this include the properties that you want to filter by, and also include the properties for pagination like PageNumber and PageSize
like this:
```csharp
public class UserFilterParams
{
    public PaginationParams Pagination { get; set; } = new();

    public UserSortBy SortBy { get; set; } = UserSortBy.CreatedAt;
    public SortDirection SortOrder { get; set; } = SortDirection.Desc;

    public string? SearchTerm { get; set; }

    public string? City { get; set; }
    public string? Country { get; set; }
    public string? StateProvince { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
}
```
## 3rd step: create Query extension methods
in Extensions folder `re-use/src/backend/ReUse.Infrastructure/Extensions/` create a file named <Name>QueryExtensions.cs
this include the extension methods for filtering and sorting the queryable
like this:
```csharp
using ReUse.Domain.Entities;
using ReUse.Application.Enums;

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

            UserSortBy.UpdatedAt => isDescending
                ? query.OrderByDescending(u => u.UpdatedAt)
                : query.OrderBy(u => u.UpdatedAt),

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
```

## 4th step: use the extension methods in the repository
like this:
```csharp
public async Task<PagedResult<User>> GetFollowersAsync(Guid userId, UserFilterParams filterParams, CancellationToken cancellationToken = default)
    {
        return await _context.Follows
            .AsNoTracking()
            .Where(f => f.FollowingId == userId)
            .Select(f => f.FollowerUser)
            .Search(filterParams.SearchTerm)
            .FilterByCity(filterParams.City)
            .FilterByCountry(filterParams.Country)
            .FilterByStateProvince(filterParams.StateProvince)
            .ApplySort(filterParams.SortBy, filterParams.SortOrder)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize, cancellationToken);
    }
```

## Notes
- all result send as a PagedResult<T> which include the pagination metadata like total count, total pages, current page and page size
- search term is applied on multiple fields (FullName and Email in this example) but you can customize it to include more fields or different fields based on your needs
- filtering methods are optional and can be applied based on the presence of the filter parameters, if a filter parameter is not provided, it will not affect the query
