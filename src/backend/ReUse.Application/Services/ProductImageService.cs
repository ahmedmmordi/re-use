using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

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


    public async Task<List<UploadedImageResponse>> UploadMultipleImagesAsync(
     UploadProductImagesRequest request)
    {
        if (request.Images is null || !request.Images.Any())
            throw new BadRequestException("At least one image is required.");

        var files = request.Images.ToList();

        foreach (var file in files)
            _imageValidator.Validate(file);

        var existingCount = await _unitOfWork.ProductImages
            .CountByProductIdAsync(request.Id);

        var uploadResults = await Task.WhenAll(
            files.Select((file, index) =>
                _cloudinary.UpdateAsync(file, $"products/{request.Id}")
                    .ContinueWith(t => new
                    {
                        Dto = t.Result,
                        Order = existingCount + index
                    }, TaskContinuationOptions.OnlyOnRanToCompletion))
        );

        try
        {
            var entities = uploadResults.Select(r => new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = request.Id,
                Url = r.Dto.Url,
                PublicId = r.Dto.PublicId,
                DisplayOrder = r.Order,
                Type = request.Type
            }).ToList();

            await _unitOfWork.ProductImages.AddRangeAsync(entities);
            await _unitOfWork.SaveChangesAsync();


            return entities.Select(e =>
           new UploadedImageResponse(e.Id, e.Url, e.PublicId)).ToList();
        }
        catch
        {
            var cleanupTasks = uploadResults
                .Select(r => _cloudinary.DeleteAsync(r.Dto.PublicId));

            await Task.WhenAll(cleanupTasks);

            throw;
        }
    }

    public async Task DeleteByPublicIdsAsync(IEnumerable<string> publicIds)
    {
        if (publicIds is null || !publicIds.Any())
            throw new BadRequestException("No public IDs provided.");


        await _cloudinary.DeleteMultipleAsync(publicIds);


        var images = await _unitOfWork.ProductImages
            .GetByPublicIdsAsync(publicIds);

        if (images.Any())
        {
            _unitOfWork.ProductImages.RemoveRange(images);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    // for update 

    public async Task DeleteImageAsync(Guid imageId, Guid userId)
    {
        var image = await _unitOfWork.ProductImages.GetByIdAsync(imageId)
            ?? throw new NotFoundException("Image not found");

        var product = await _unitOfWork.Product.GetByIdAsync(image.ProductId)
            ?? throw new NotFoundException("Product not found");

        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this image");

        if (product.Status == ProductStatus.Deleted)
            throw new BadRequestException("Cannot modify a deleted product");

        // منع مسح آخر صورة
        var imageCount = await _unitOfWork.ProductImages.CountByProductIdAsync(image.ProductId);
        if (imageCount <= 1)
            throw new BadRequestException("Product must have at least one image");

        await _cloudinary.DeleteAsync(image.PublicId);

        _unitOfWork.ProductImages.Remove(image);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ReorderImagesAsync(ReorderImagesRequest request, Guid userId)
    {
        var imageIds = request.Items.Select(x => x.ImageId).ToList();

        var images = await _unitOfWork.ProductImages.GetByIdsAsync(imageIds);

        if (images.Count != imageIds.Count)
            throw new NotFoundException("One or more images not found");


        var productIds = images.Select(x => x.ProductId).Distinct().ToList();
        if (productIds.Count > 1)
            throw new BadRequestException("All images must belong to the same product");

        var product = await _unitOfWork.Product.GetByIdAsync(productIds[0])
            ?? throw new NotFoundException("Product not found");

        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.Status == ProductStatus.Deleted)
            throw new BadRequestException("Cannot modify a deleted product");

        // Apply reorder
        foreach (var item in request.Items)
        {
            var image = images.First(x => x.Id == item.ImageId);
            image.DisplayOrder = item.DisplayOrder;
        }

        await _unitOfWork.SaveChangesAsync();
    }


}