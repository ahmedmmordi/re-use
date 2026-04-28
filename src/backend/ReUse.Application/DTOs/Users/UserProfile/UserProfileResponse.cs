namespace ReUse.Application.DTOs.Users.UserProfile;

public class UserProfileResponse
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = null!;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? ProfileImageUrl { get; set; }

    public string? Bio { get; set; }

    public string? CoverImageUrl { get; set; }

    public string? AddressLine1 { get; set; }

    public string? City { get; set; }

    public string? StateProvince { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

    public int FollowersCount { get; set; }

    public int FollowingCount { get; set; }
}