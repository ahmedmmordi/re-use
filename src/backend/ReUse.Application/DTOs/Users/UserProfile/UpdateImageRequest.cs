using Microsoft.AspNetCore.Http;

using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Users.UserProfile;

public record UpdateImageRequest
{
    public IFormFile Image { get; init; } = null!;
}