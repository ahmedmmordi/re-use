using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs;
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

    #region Create
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
            LocationCity = request.BasicInfo.LocationCity,
            LocationCountry = request.BasicInfo.LocationCountry,
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
            LocationCity = request.BasicInfo.LocationCity,
            LocationCountry = request.BasicInfo.LocationCountry,
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
    // WANTED
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
            LocationCity = request.BasicInfo.LocationCity,
            LocationCountry = request.BasicInfo.LocationCountry,
            OwnerUserId = sellerId,
            DesiredPriceMin = request.DesiredPriceMin,
            DesiredPriceMax = request.DesiredPriceMax
        };

        return await PersistProductAsync(product, request.Images);
    }

    #endregion

    #region GetById
    public async Task<ProductDetailsResponse> GetByIdAsync(Guid productId)
    {
        if (productId == Guid.Empty)
            throw new BadRequestException("Invalid product id");

        var product = await _unitOfWork.Product.GetProductDetailsAsync(productId);

        if (product is null)
            throw new NotFoundException("Product not found.");

        return MapToDetails(product);
    }
    #endregion

    #region GetAll
    public async Task<PagedResult<ProductResponse>> GetAllProductsAsync(
  ProductFilterParams filterParams)
    {
        var pagedProducts = await _unitOfWork.Product.GetAllAsync(filterParams);

        return new PagedResult<ProductResponse>
        {
            Data = pagedProducts.Data.Select(MapToProductResponse).ToList(),
            PageNumber = pagedProducts.PageNumber,
            PageSize = pagedProducts.PageSize,
            TotalRecords = pagedProducts.TotalRecords
        };
    }
    #endregion

    #region Update

    public async Task<ProductResponse> UpdateRegularProductAsync(
        Guid productId,
        UpdateRegularProductRequest request,
        Guid userId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product not found");

        // Business Rules
        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Regular)
            throw new BadRequestException("Product type cannot be changed");

        if (product.Status == ProductStatus.Deleted)
            throw new BadRequestException("Cannot update a deleted product");

        var regular = (RegularProduct)product;

        // Apply BasicInfo
        if (request.BasicInfo is not null)
            await ApplyBasicInfoUpdate(regular, request.BasicInfo);

        // Apply type-specific fields
        if (request.Price is not null)
            regular.Price = request.Price.Value;

        if (request.AllowNegotiation is not null)
            regular.AllowNegotiation = request.AllowNegotiation.Value;

        // Post-update validation
        if (regular.Price <= 0)
            throw new BadRequestException("Product must have a valid price after update");

        await _unitOfWork.SaveChangesAsync();

        return MapRegularProduct(regular);
    }

    public async Task<ProductResponse> UpdateSwapProductAsync(
        Guid productId,
        UpdateSwapProductRequest request,
        Guid userId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product not found");

        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Swap)
            throw new BadRequestException("Product type cannot be changed");

        if (product.Status == ProductStatus.Deleted)
            throw new BadRequestException("Cannot update a deleted product");

        var swap = (SwapProduct)product;

        if (request.BasicInfo is not null)
            await ApplyBasicInfoUpdate(swap, request.BasicInfo);

        if (request.WantedItemTitle is not null)
            swap.WantedItemTitle = request.WantedItemTitle;

        if (request.WantedItemDescription is not null)
            swap.WantedItemDescription = request.WantedItemDescription;

        // Post-update validation
        if (string.IsNullOrWhiteSpace(swap.WantedItemTitle))
            throw new BadRequestException("Swap product must have a wanted item title");

        await _unitOfWork.SaveChangesAsync();

        return MapSwapProduct(swap, 0);
    }

    public async Task<ProductResponse> UpdateWantedProductAsync(
        Guid productId,
        UpdateWantedProductRequest request,
        Guid userId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product not found");

        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Wanted)
            throw new BadRequestException("Product type cannot be changed");

        if (product.Status == ProductStatus.Deleted)
            throw new BadRequestException("Cannot update a deleted product");

        var wanted = (WantedProduct)product;

        if (request.BasicInfo is not null)
            await ApplyBasicInfoUpdate(wanted, request.BasicInfo);

        if (request.DesiredPriceMin is not null)
            wanted.DesiredPriceMin = request.DesiredPriceMin.Value;

        if (request.DesiredPriceMax is not null)
            wanted.DesiredPriceMax = request.DesiredPriceMax.Value;

        // Post-update validation
        if (wanted.DesiredPriceMin.HasValue &&
            wanted.DesiredPriceMax.HasValue &&
            wanted.DesiredPriceMax < wanted.DesiredPriceMin)
            throw new BadRequestException("Maximum price must be >= minimum price after update");

        await _unitOfWork.SaveChangesAsync();

        return MapWantedProduct(wanted);
    }

    // Helper Shared Method to Apply Basic Info Updates
    private async Task ApplyBasicInfoUpdate(Product product, BasicInfoUpdateRequest info)
    {
        if (info.Title is not null)
            product.Title = info.Title;

        if (info.Description is not null)
            product.Description = info.Description;

        if (info.LocationCity is not null)
            product.LocationCity = info.LocationCity;

        if (info.LocationCountry is not null)
            product.LocationCountry = info.LocationCountry;

        if (info.CategoryId.HasValue)
        {
            await EnsureLeafCategory(info.CategoryId.Value);
            product.CategoryId = info.CategoryId.Value;
        }

        if (info.Condition.HasValue)
            product.Condition = info.Condition.Value;
    }

    #endregion

    #region Monitor
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
    #endregion

    #region COMMON 

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

    #endregion

    #region MAPPING 

    private static ProductResponse MapToProductResponse(Product product)
    {
        var images = product.ProductImages
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new UploadedImageResponse(i.Id, i.Url, i.PublicId))
            .ToList();

        decimal? price = null;
        bool allowNegotiation = false;
        string? wantedItem = null;
        string? wantedItemDesc = null;
        decimal? minPrice = null;
        decimal? maxPrice = null;

        switch (product)
        {
            case RegularProduct r:
                price = r.Price;
                allowNegotiation = r.AllowNegotiation;
                break;

            case SwapProduct s:
                wantedItem = s.WantedItemTitle;
                wantedItemDesc = s.WantedItemDescription;
                break;

            case WantedProduct w:
                minPrice = w.DesiredPriceMin;
                maxPrice = w.DesiredPriceMax;
                break;
        }

        return new ProductResponse(
            Id: product.Id,
            Type: product.ProductType,
            Title: product.Title,
            Description: product.Description,
            CategoryId: product.CategoryId,
            Condition: product.Condition,
            LocationCity: product.LocationCity,
            LocationCountry: product.LocationCountry,
            OwnerUserId: product.OwnerUserId,
            CreatedAt: product.CreatedAt,
            Price: price,
            AllowNegotiation: allowNegotiation,
            WantedItem: wantedItem,
            WantedItemDescription: wantedItemDesc,
            MinPrice: minPrice,
            MaxPrice: maxPrice,
            Images: images,
            CoverImageUrl: images.FirstOrDefault()?.Url ?? string.Empty
        );
    }


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
            product.LocationCity,
            product.LocationCountry,
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
            product.LocationCity,
            product.LocationCountry,
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
            product.LocationCity,
            product.LocationCountry,
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

    private static ProductDetailsResponse MapToDetails(Product product)
    {
        var images = product.ProductImages
            .OrderBy(i => i.DisplayOrder)
            .Select(i => i.Url)
            .ToList();

        // CategoryId = subcategory when present, root category otherwise
        var categoryId = product.CategoryId;
        var categoryName = product.Category.Name;

        //  Type-specific fields 
        decimal? price = null;
        bool? allowNegotiation = null;
        string? wantedItemTitle = null;
        string? wantedItemDesc = null;
        string? wantedCondition = null;
        decimal? desiredPriceMin = null;
        decimal? desiredPriceMax = null;

        switch (product)
        {
            case RegularProduct r:
                price = r.Price;
                allowNegotiation = r.AllowNegotiation;
                break;

            case SwapProduct s:
                wantedItemTitle = s.WantedItemTitle;
                wantedItemDesc = s.WantedItemDescription;
                wantedCondition = FormatCondition(s.WantedCondition);
                break;

            case WantedProduct w:
                desiredPriceMin = w.DesiredPriceMin;
                desiredPriceMax = w.DesiredPriceMax;
                break;
        }

        return new ProductDetailsResponse(
        Id: product.Id,
        Title: product.Title,
        Description: product.Description,
        Type: product.ProductType.ToString(),
        Condition: FormatCondition(product.Condition),
        Status: product.Status.ToString().ToLower(),

        LocationCity: product.LocationCity,
        LocationCountry: product.LocationCountry,

        Price: price,
        AllowNegotiation: allowNegotiation,

        WantedItemTitle: wantedItemTitle,
        WantedItemDescription: wantedItemDesc,
        WantedCondition: wantedCondition,

        DesiredPriceMin: desiredPriceMin,
        DesiredPriceMax: desiredPriceMax,

        Images: images,
        CreatedAt: product.CreatedAt,
        CategoryId: categoryId,
        CategoryName: categoryName,
        OwnerUserId: product.OwnerUserId,
        OwnerUserName: product.Owner.FullName,
        MemberSince: product.Owner.CreatedAt.ToString("MMMM yyyy")
);
    }
    // Formatter
    private static string FormatCondition(ProductCondition? condition) => condition switch
    {
        ProductCondition.New => "New",
        ProductCondition.LikeNew => "Like New",
        ProductCondition.Used => "Used",
        ProductCondition.Broken => "Broken",
        _ => condition.ToString()
    };

}
#endregion
