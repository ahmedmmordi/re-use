namespace ReUse.Application.DTOs.Users.UserProfile;

public record UserProfileResponse
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = null!;
    public string? Email { get; init; }
    public string? PhoneNumber { get; init; }
    public string? ProfileImageUrl { get; init; }
    public string? Bio { get; init; }
    public string? CoverImageUrl { get; init; }
    public string? AddressLine1 { get; init; }
    public string? City { get; init; }
    public string? StateProvince { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
    public int FollowersCount { get; init; }
    public int FollowingCount { get; init; }
}