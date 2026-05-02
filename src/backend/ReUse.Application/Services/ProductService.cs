using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IProductImageService _productImageService;

    public ProductService(IUnitOfWork unitOfWork, IProductImageService productImageService)
    {
        _unitOfWork = unitOfWork;
        _productImageService = productImageService;
    }

    // REGULAR 
    public async Task<ProductResponse> CreateRegularProductAsync(
        CreateRegularProductRequest request,
        Guid sellerId)
    {
        if (request is null)
            throw new BadRequestException("Request cannot be null");

        if (request.BasicInfo is null)
            throw new BadRequestException("Invalid basic info");

        await EnsureLeafCategory(request.BasicInfo.CategoryId);

        var product = new RegularProduct
        {
            Title = request.BasicInfo.Title,
            Description = request.BasicInfo.Description,
            CategoryId = request.BasicInfo.CategoryId,
            Condition = request.BasicInfo.Condition,
            OwnerUserId = sellerId,
            Price = request.Price,
            AllowNegotiation = request.AllowNegotiation
        };

        return await PersistProductAsync(product, request.Images);
    }

    // SWAP 
    public async Task<ProductResponse> CreateSwapProductAsync(
        CreateSwapProductRequest request,
        Guid sellerId)
    {
        if (request is null)
            throw new BadRequestException("Request cannot be null");

        if (request.BasicInfo is null)
            throw new BadRequestException("Invalid basic info");

        if (request.OfferImages is null || !request.OfferImages.Any())
            throw new BadRequestException("Offer images are required");

        await EnsureLeafCategory(request.BasicInfo.CategoryId);

        var product = new SwapProduct
        {
            Title = request.BasicInfo.Title,
            Description = request.BasicInfo.Description,
            CategoryId = request.BasicInfo.CategoryId,
            Condition = request.BasicInfo.Condition,
            OwnerUserId = sellerId,
            WantedItemTitle = request.WantedItemTitle,
            WantedItemDescription = request.WantedItemDescription
        };

        return await PersistSwapProductAsync(
            product,
            request.OfferImages,
            request.WantedImages
        );
    }

    private async Task<ProductResponse> PersistSwapProductAsync(
        SwapProduct product,
        List<IFormFile> offerImages,
        List<IFormFile>? wantedImages)
    {
        List<string>? uploadedIds = null;

        await _unitOfWork.BeginTransactionAsync();

        try
        {
            _unitOfWork.Product.Add(product);
            await _unitOfWork.SaveChangesAsync();

            var allUploaded = new List<UploadedImageResponse>();

            int offerCount = offerImages?.Count ?? 0;

            // Offer
            if (offerImages?.Any() == true)
            {
                var offerUpload = await _productImageService.UploadMultipleImagesAsync(
                    new UploadProductImagesRequest
                    {
                        Id = product.Id,
                        Images = offerImages
                    });

                allUploaded.AddRange(offerUpload);
            }

            // Wanted
            if (wantedImages?.Any() == true)
            {
                var wantedUpload = await _productImageService.UploadMultipleImagesAsync(
                    new UploadProductImagesRequest
                    {
                        Id = product.Id,
                        Images = wantedImages
                    });

                allUploaded.AddRange(wantedUpload);
            }

            uploadedIds = allUploaded.Select(x => x.PublicId).ToList();

            await _unitOfWork.CommitTransactionAsync();

            var fullProduct = await _unitOfWork.Product.GetByIdAsync(product.Id) ?? product;

            return MapSwapProduct((SwapProduct)fullProduct, offerCount);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();

            if (uploadedIds?.Any() == true)
                await _productImageService.DeleteByPublicIdsAsync(uploadedIds);

            throw;
        }
    }

    //  WANTED 
    public async Task<ProductResponse> CreateWantedProductAsync(
        CreateWantedProductRequest request,
        Guid sellerId)
    {
        if (request is null)
            throw new BadRequestException("Request cannot be null");

        if (request.BasicInfo is null)
            throw new BadRequestException("Invalid basic info");

        await EnsureLeafCategory(request.BasicInfo.CategoryId);

        var product = new WantedProduct
        {
            Title = request.BasicInfo.Title,
            Description = request.BasicInfo.Description,
            CategoryId = request.BasicInfo.CategoryId,
            Condition = request.BasicInfo.Condition,
            OwnerUserId = sellerId,
            DesiredPriceMin = request.DesiredPriceMin,
            DesiredPriceMax = request.DesiredPriceMax
        };

        return await PersistProductAsync(product, request.Images);
    }

    // COMMON 
    private async Task<ProductResponse> PersistProductAsync(
        Product product,
        List<IFormFile> imageFiles)
    {
        List<string>? uploadedPublicIds = null;

        await _unitOfWork.BeginTransactionAsync();

        try
        {
            _unitOfWork.Product.Add(product);
            await _unitOfWork.SaveChangesAsync();

            if (imageFiles?.Any() == true)
            {
                var uploadedImages = await _productImageService
                    .UploadMultipleImagesAsync(new UploadProductImagesRequest
                    {
                        Id = product.Id,
                        Images = imageFiles
                    });

                uploadedPublicIds = uploadedImages.Select(x => x.PublicId).ToList();
            }

            await _unitOfWork.CommitTransactionAsync();

            var fullProduct = await _unitOfWork.Product
                .GetByIdAsync(product.Id) ?? product;

            return fullProduct.ProductType switch
            {
                ProductType.Regular => MapRegularProduct((RegularProduct)fullProduct),
                ProductType.Swap => MapSwapProduct((SwapProduct)fullProduct, 0), // fallback
                ProductType.Wanted => MapWantedProduct((WantedProduct)fullProduct),
                _ => throw new InvalidOperationException("Unknown product type")
            };
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();

            if (uploadedPublicIds?.Any() == true)
                await _productImageService.DeleteByPublicIdsAsync(uploadedPublicIds);

            throw;
        }
    }

    private async Task EnsureLeafCategory(Guid categoryId)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(categoryId);

        if (category is null)
            throw new NotFoundException("Category not found");

        if (category.ParentId is null)
            throw new BadRequestException("Category must be a subcategory");
    }

    // MAPPING 

    private ProductResponse MapRegularProduct(RegularProduct product)
    {
        var images = MapImages(product);

        return new ProductResponse(
            product.Id,
            product.ProductType,
            product.Title,
            product.Description,
            product.CategoryId,
            product.Condition,
            product.OwnerUserId,
            product.CreatedAt,
            product.Price,
            product.AllowNegotiation,
            null,
            null,
            null,
            null,
            images,
            images.FirstOrDefault()?.Url ?? string.Empty
        );
    }

    private ProductResponse MapWantedProduct(WantedProduct product)
    {
        var images = MapImages(product);

        return new ProductResponse(
            product.Id,
            product.ProductType,
            product.Title,
            product.Description,
            product.CategoryId,
            product.Condition,
            product.OwnerUserId,
            product.CreatedAt,
            null,
            false,
            null,
            null,
            product.DesiredPriceMin,
            product.DesiredPriceMax,
            images,
            images.FirstOrDefault()?.Url ?? string.Empty
        );
    }

    private ProductResponse MapSwapProduct(SwapProduct product, int offerCount)
    {
        var images = product.ProductImages ?? new List<ProductImage>();

        var offerImages = images.Take(offerCount)
            .Select(i => new UploadedImageResponse(i.Id, i.Url, i.PublicId))
            .ToList();

        var wantedImages = images.Skip(offerCount)
            .Select(i => new UploadedImageResponse(i.Id, i.Url, i.PublicId))
            .ToList();

        var allImages = offerImages.Concat(wantedImages).ToList();

        return new ProductResponse(
            product.Id,
            product.ProductType,
            product.Title,
            product.Description,
            product.CategoryId,
            product.Condition,
            product.OwnerUserId,
            product.CreatedAt,
            null,
            false,
            product.WantedItemTitle,
            product.WantedItemDescription,
            null,
            null,
            allImages,
            offerImages.FirstOrDefault()?.Url ?? string.Empty
        );
    }

    private List<UploadedImageResponse> MapImages(Product product)
    {
        return product.ProductImages?
            .Select(i => new UploadedImageResponse(i.Id, i.Url, i.PublicId))
            .ToList() ?? new List<UploadedImageResponse>();
    }
}