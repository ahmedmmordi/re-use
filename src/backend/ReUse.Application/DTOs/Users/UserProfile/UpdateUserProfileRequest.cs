namespace ReUse.Application.DTOs.Users.UserProfile;

public class UpdateUserProfileRequest
{
    public string? FullName { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Bio { get; set; }

    public string? AddressLine1 { get; set; }

    public string? City { get; set; }

    public string? StateProvince { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }
}