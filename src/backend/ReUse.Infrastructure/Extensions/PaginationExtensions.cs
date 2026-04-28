using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;

namespace ReUse.Infrastructure.Extensions;

public static class PaginationExtensions
{
    /// <summary>
    /// Applies pagination to a query and returns a paged result
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedListAsync<T>(
        this IQueryable<T> query,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default) where T : class
    {
        // Get total count BEFORE pagination
        var totalRecords = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>
        {
            Data = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalRecords = totalRecords
        };
    }
}