using Microsoft.AspNetCore.Http;

using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Users.UserProfile;

public record UpdateProfileImageRequest
{
    public IFormFile Image { get; init; } = null!;
    public ProfileImageOptions ImageType { get; init; }
}