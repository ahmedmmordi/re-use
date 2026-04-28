namespace ReUse.Application.DTOs;

public class PagedResult<T>
{
    public List<T> Data { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }

    // Calculated properties
    public int TotalPages => (int)Math.Ceiling(TotalRecords / (double)PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;

    // Helpful metadata
    public int FirstRowOnPage => TotalRecords == 0 ? 0 : ((PageNumber - 1) * PageSize) + 1;
    public int LastRowOnPage => Math.Min(PageNumber * PageSize, TotalRecords);
}