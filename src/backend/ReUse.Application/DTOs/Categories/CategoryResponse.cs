namespace ReUse.Application.DTOs.Categories;

public record CategoryResponse
{
    public Guid Id { get; init; }
    public Guid? ParentId { get; init; }
    public string Name { get; init; } = null!;
    public string Slug { get; init; } = null!;
    public string? Description { get; init; }
    public string? IconUrl { get; init; }
    public bool IsActive { get; init; }
    public int ProductCount { get; init; }
    public List<CategoryResponse> Subcategories { get; init; } = new();
}