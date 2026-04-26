namespace ReUse.Application.DTOs.Categories.Contracts;

public class CategoryDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }

    public bool IsActive { get; set; }


    public int ProductCount { get; set; }

    public List<CategoryDto> Subcategories { get; set; } = new();
}