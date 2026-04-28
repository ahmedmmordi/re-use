using Microsoft.AspNetCore.Http;

using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Users.UserProfile;

public class UpdateProfileImageRequest
{
    public IFormFile Image { get; set; } = null!;

    public ProfileImageOptions ImageType { get; set; }
}