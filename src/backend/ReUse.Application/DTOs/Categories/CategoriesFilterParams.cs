using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Categories;

public class CategoriesFilterParams
{
    public PaginationParams Pagination { get; set; } = new();

    public CategoriesSortBy SortBy { get; set; } = CategoriesSortBy.CreatedAt;
    public SortDirection SortOrder { get; set; } = SortDirection.Desc;

    // Global search across multiple fields
    public string? SearchTerm { get; set; }

    // Specific field filters
    public Guid? ParentId { get; set; }
    public bool? IsActive { get; set; }
}