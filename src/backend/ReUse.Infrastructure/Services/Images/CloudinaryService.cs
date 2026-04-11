using System.Net;

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.Images;
using ReUse.Application.Options.Cloudniary;

namespace ReUse.Infrastructure.Services.Images;

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
    public async Task<ImageUpdatedDto> UpdateAsync(IFormFile file, string folder)
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

        return new ImageUpdatedDto(
        result.SecureUrl.ToString(),
        result.PublicId
        );
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
}