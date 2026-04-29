namespace ReUse.Application.DTOs.Follows;

public record FollowResultDto(
    Guid FollowingId,
    string FullName,
    bool IsNowFollowing
);