using ReUse.Application.DTOs.Products;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;

namespace ReUse.Application.Services;
public class ProductImageService : IProductImageService
{
    private readonly IImageValidator _imageValidator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICloudinaryService _cloudinary;

    public ProductImageService(
        IImageValidator imageValidator,
        IUnitOfWork unitOfWork,
        ICloudinaryService cloudinary)
    {
        _imageValidator = imageValidator;
        _unitOfWork = unitOfWork;
        _cloudinary = cloudinary;
    }


    public async Task<List<string>> UploadMultipleImagesAsync(UploadProductImagesRequest command)
    {
        if (command.Images is null || !command.Images.Any())
            throw new BadRequestException("At least one image is required.");

        var files = command.Images.ToList();

        foreach (var file in files)
            _imageValidator.Validate(file);

        var existingCount = await _unitOfWork.ProductImages
            .CountByProductIdAsync(command.Id);

        var uploadResults = await Task.WhenAll(
            files.Select((file, index) =>
                _cloudinary.UpdateAsync(file, $"products/{command.Id}")
                    .ContinueWith(t => (Dto: t.Result, Order: existingCount + index),
                        TaskContinuationOptions.OnlyOnRanToCompletion))
        );

        try
        {
            var entities = uploadResults.Select(r => new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = command.Id,
                Url = r.Dto.Url,
                PublicId = r.Dto.PublicId,
                DisplayOrder = r.Order
            }).ToList();

            await _unitOfWork.ProductImages.AddRangeAsync(entities);
            await _unitOfWork.SaveChangesAsync();

            return entities.Select(e => e.Url).ToList();
        }
        catch
        {
            var cleanupTasks = uploadResults
                .Select(r => _cloudinary.DeleteAsync(r.Dto.PublicId));

            await Task.WhenAll(cleanupTasks);

            throw;
        }
    }
}