using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.Images;
using ReUse.Application.Options.Images;

namespace ReUse.Infrastructure.Services.Images;

public class ImageValidator : IImageValidator
{
    // White listing => Content Validation

    public void Validate(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new BadRequestException("Image is required");

        if (file.Length > ImageOptions.MaxFileSizeInBytes)
            throw new BadRequestException(
                $"Image size must be less than {ImageOptions.MaxFileSizeInMB}MB");

        // avoid new folder generate 
        if (file.FileName.Contains("/") || file.FileName.Contains("\\") || file.FileName.Contains(".."))
        {
            throw new BadRequestException("Invalid file name");
        }

        if (!ImageOptions.AllowedMimeTypes.Contains(file.ContentType))
            throw new BadRequestException("Unsupported image type");

        // Binary sig
        using var reader = new BinaryReader(file.OpenReadStream());
        var bytes = reader.ReadBytes(2);
        var fileHex = BitConverter.ToString(bytes);

        if (!ImageOptions.FileSignatures.TryGetValue(file.ContentType, out var signatures) ||
            !signatures.Contains(fileHex))
        {
            throw new BadRequestException("Invalid image content");
        }

    }
}