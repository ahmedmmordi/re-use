namespace ReUse.Application.DTOs.Follows;

public record FollowDto(
    Guid Id,
    string FullName,
    string? ProfileImageUrl,
    string? Bio,
    int FollowersCount
);