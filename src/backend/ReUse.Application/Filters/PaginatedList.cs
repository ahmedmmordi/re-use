using Microsoft.EntityFrameworkCore;

namespace ReUse.Application.Options.Filters;

public class PaginatedList<T>(List<T> items, int pageNumber, int count, int pageSize)
{
    public List<T> Items { get; private set; } = items;

    public int PageNumber { get; private set; } = pageNumber;

    public int TotalPages { get; private set; } =
        (int)Math.Ceiling(count / (double)pageSize);

    public int TotalCount { get; private set; } = count;

    public int PageSize { get; private set; } = pageSize;

    public bool Haspreviouspage => PageNumber > 1;

    public bool HasNextpage => PageNumber < TotalPages;

    // method for create paginated list And Return 
    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source,
        int pagenumber,
        int pagesize)
    {
        if (pagenumber <= 0)
            throw new ArgumentOutOfRangeException(nameof(pagenumber));

        if (pagesize <= 0)
            throw new ArgumentOutOfRangeException(nameof(pagesize));

        const int maxPageSize = 100;
        pagesize = Math.Min(pagesize, maxPageSize);

        var count = await source.CountAsync();

        var items = await source
            .Skip((pagenumber - 1) * pagesize)
            .Take(pagesize)
            .ToListAsync();

        return new PaginatedList<T>(items, pagenumber, count, pagesize);
    }
}