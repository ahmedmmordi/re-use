using System.Net;

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Options;

namespace ReUse.Infrastructure.Services.Storage;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IOptions<CloudinaryOptions> options)
    {
        var settings = options.Value;

        var account = new Account(
            settings.CloudName,
            settings.ApiKey,
            settings.ApiSecret
        );

        _cloudinary = new Cloudinary(account);
    }

    #region Upload
    public async Task<ImageUpdatedResponse> UpdateAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0)
            throw new BadRequestException("Invalid image file");

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,  //users/{userId} 
            Transformation = new Transformation()
                .Width(800)
                .Height(800)
                .Crop("limit")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.StatusCode != HttpStatusCode.OK && result.StatusCode != HttpStatusCode.Created)
            throw new BadRequestException("Failed to upload image");

        return new ImageUpdatedResponse(result.SecureUrl.ToString(), result.PublicId);
    }
    #endregion

    #region Delete
    public async Task DeleteAsync(string publicId)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return;

        await _cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            ResourceType = ResourceType.Image
        });
    }
    #endregion

    #region DeleteMultiple
    public async Task DeleteMultipleAsync(IEnumerable<string> publicIds)
    {
        if (publicIds is null || !publicIds.Any())
            return;

        var deleteTasks = publicIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => _cloudinary.DestroyAsync(new DeletionParams(id)
            {
                ResourceType = ResourceType.Image
            }));

        await Task.WhenAll(deleteTasks);
    }
    #endregion
}