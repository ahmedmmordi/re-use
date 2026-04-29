using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs.Users.UserProfile;

namespace ReUse.Application.Interfaces.Services.External;

public interface ICloudinaryService
{
    Task<ImageUpdatedResponse> UpdateAsync(IFormFile file, string folder);
    Task DeleteAsync(string publicId);

}