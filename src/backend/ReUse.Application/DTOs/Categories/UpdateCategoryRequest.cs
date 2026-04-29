namespace ReUse.Application.DTOs.Categories;

public record UpdateCategoryRequest(
    string? Name,
    string? Slug,
    string? Description,
    string? IconUrl,
    bool? IsActive,
    Guid? ParentId
);