namespace ReUse.Application.DTOs.Categories;

public class CreateCategoryRequest
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }

    public Guid? ParentId { get; set; }

    public bool IsActive { get; set; } = true;


}