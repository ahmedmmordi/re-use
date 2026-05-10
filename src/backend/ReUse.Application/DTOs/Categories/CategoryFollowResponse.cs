namespace ReUse.Application.DTOs.Categories;

public record CategoryFollowResponse(
    Guid CategoryId,
    string Name,
    string Slug,
    string? IconUrl,
    DateTime FollowedAt
);