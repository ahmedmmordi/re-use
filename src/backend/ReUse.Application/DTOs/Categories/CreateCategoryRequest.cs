namespace ReUse.Application.DTOs.Categories;

public record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description,
    string? IconUrl,
    Guid? ParentId,
    bool IsActive = true
);