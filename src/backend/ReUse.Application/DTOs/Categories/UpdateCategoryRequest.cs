namespace ReUse.Application.DTOs.Categories;

public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public bool? IsActive { get; set; }
    public Guid? ParentId { get; set; }
}