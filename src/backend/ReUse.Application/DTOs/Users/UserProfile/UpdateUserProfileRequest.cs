namespace ReUse.Application.DTOs.Users.UserProfile;

public record UpdateUserProfileRequest
{
    public string? FullName { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Bio { get; init; }
    public string? AddressLine1 { get; init; }
    public string? City { get; init; }
    public string? StateProvince { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
}