using AutoMapper;

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
    private readonly IMapper _mapper;

    public ProductService(IUnitOfWork unitOfWork, IProductImageService productImageService, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _productImageService = productImageService;
        _mapper = mapper;
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

        var product = _mapper.Map<RegularProduct>(request);
        product.OwnerUserId = sellerId;

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

        var product = _mapper.Map<SwapProduct>(request);
        product.OwnerUserId = sellerId;

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

        var product = _mapper.Map<WantedProduct>(request);
        product.OwnerUserId = sellerId;

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
            throw new NotFoundException("Product");

        return _mapper.Map<ProductDetailsResponse>(product);
    }
    #endregion

    #region GetAll
    public async Task<PagedResult<ProductResponse>> GetAllProductsAsync(ProductFilterParams filterParams)
    {
        var pagedProducts = await _unitOfWork.Product.GetAllAsync(filterParams);

        return new PagedResult<ProductResponse>
        {
            Data = pagedProducts.Data.Select(p => _mapper.Map<ProductResponse>(p)).ToList(),
            PageNumber = pagedProducts.PageNumber,
            PageSize = pagedProducts.PageSize,
            TotalRecords = pagedProducts.TotalRecords
        };
    }
    #endregion

    #region GetMyLists
    public async Task<SellerDashboardResponse> GetMyListingsAsync(Guid userId, MyListingsParams filterParams)
    {
        var pagedListings = await _unitOfWork.Product.GetMyListingsAsync(userId, filterParams);

        var summary = await _unitOfWork.Product.GetSellerSummaryAsync(userId);

        return new SellerDashboardResponse
        {
            Summary = _mapper.Map<SellerSummaryResponse>(summary),
            Products = pagedListings.Data
                .Select(p => _mapper.Map<ProductResponse>(p))
                .ToList()
        };
    }
    #endregion

    #region  GetPublicProductsByUser
    public async Task<PagedResult<ProductResponse>> GetPublicProductsByUserAsync(Guid ownerId, ProductFilterParams filterParams)
    {
        if (ownerId == Guid.Empty)
            throw new BadRequestException("Invalid user id");

        var pagedProducts = await _unitOfWork.Product
            .GetPublicProductsByUserAsync(ownerId, filterParams);

        return new PagedResult<ProductResponse>
        {
            Data = pagedProducts.Data.Select(p => _mapper.Map<ProductResponse>(p)).ToList(),
            PageNumber = pagedProducts.PageNumber,
            PageSize = pagedProducts.PageSize,
            TotalRecords = pagedProducts.TotalRecords
        };
    }
    #endregion

    #region Update

    public async Task UpdateRegularProductAsync(
        Guid productId,
        UpdateRegularProductRequest request,
        Guid userId,
        bool isAdmin = false)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        // Business Rules
        if (!isAdmin && product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Regular)
            throw new BadRequestException("Product type cannot be changed");

        EnsureNotDeleted(product);

        var regular = (RegularProduct)product;

        if (request.BasicInfo is not null)
        {
            _mapper.Map(request.BasicInfo, product);
        }

        _mapper.Map(request, product);

        // Post-update validation
        if (regular.Price <= 0)
            throw new BadRequestException("Product must have a valid price after update");

        await _unitOfWork.SaveChangesAsync();

    }

    public async Task UpdateSwapProductAsync(
        Guid productId,
        UpdateSwapProductRequest request,
        Guid userId,
        bool isAdmin = false)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (!isAdmin && product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Swap)
            throw new BadRequestException("Product type cannot be changed");

        EnsureNotDeleted(product);

        var swap = (SwapProduct)product;

        if (request.BasicInfo is not null)
        {
            _mapper.Map(request.BasicInfo, product);
        }

        _mapper.Map(request, swap);

        // Post-update validation
        if (string.IsNullOrWhiteSpace(swap.WantedItemTitle))
            throw new BadRequestException("Swap product must have a wanted item title");

        await _unitOfWork.SaveChangesAsync();

    }

    public async Task UpdateWantedProductAsync(
        Guid productId,
        UpdateWantedProductRequest request,
        Guid userId,
        bool isAdmin = false)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (!isAdmin && product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.ProductType != ProductType.Wanted)
            throw new BadRequestException("Product type cannot be changed");

        EnsureNotDeleted(product);

        var wanted = (WantedProduct)product;

        if (request.BasicInfo is not null)
        {
            _mapper.Map(request.BasicInfo, product);
        }

        _mapper.Map(request, wanted);

        // Post-update validation
        if (wanted.DesiredPriceMin.HasValue &&
            wanted.DesiredPriceMax.HasValue &&
            wanted.DesiredPriceMax < wanted.DesiredPriceMin)
            throw new BadRequestException("Maximum price must be >= minimum price after update");

        await _unitOfWork.SaveChangesAsync();
    }

    #endregion

    #region Delete
    public async Task DeleteProductAsync(Guid productId, Guid userId, bool isAdmin = false)
    {
        if (productId == Guid.Empty)
            throw new BadRequestException("Invalid product id");


        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (!isAdmin && product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        EnsureNotDeleted(product);

        product.Status = ProductStatus.Deleted;

        await _unitOfWork.SaveChangesAsync();
    }
    #endregion

    #region DeleteHelper
    private static void EnsureNotDeleted(Product product)
    {
        if (product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");
    }
    #endregion

    #region Admin

    public async Task<PagedResult<ProductResponse>> GetAllForAdminAsync(AdminProductFilterParams filterParams)
    {
        var pagedProducts = await _unitOfWork.Product.GetAllForAdminAsync(filterParams);

        return new PagedResult<ProductResponse>
        {
            Data = pagedProducts.Data.Select(p => _mapper.Map<ProductResponse>(p)).ToList(),
            PageNumber = pagedProducts.PageNumber,
            PageSize = pagedProducts.PageSize,
            TotalRecords = pagedProducts.TotalRecords
        };
    }

    public async Task<ProductDetailsResponse> GetForAdminByIdAsync(Guid productId)
    {
        if (productId == Guid.Empty)
            throw new BadRequestException("Invalid product id");

        var product = await _unitOfWork.Product.GetForAdminByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        return _mapper.Map<ProductDetailsResponse>(product);
    }

    public async Task<AdminProductsSummaryResponse> GetAdminSummaryAsync()
    {
        var summary = await _unitOfWork.Product.GetAdminSummaryAsync();
        return _mapper.Map<AdminProductsSummaryResponse>(summary);
    }

    public async Task ChangeProductStatusByAdminAsync(Guid productId, ProductStatus status)
    {
        if (productId == Guid.Empty)
            throw new BadRequestException("Invalid product id");

        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (product.Status == status)
            return;

        product.Status = status;

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RestoreProductByAdminAsync(Guid productId)
    {
        if (productId == Guid.Empty)
            throw new BadRequestException("Invalid product id");

        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (product.Status != ProductStatus.Deleted)
            throw new BadRequestException("Only deleted products can be restored");

        product.Status = ProductStatus.Active;

        await _unitOfWork.SaveChangesAsync();
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

            return _mapper.Map<ProductResponse>(fullProduct);
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

            return _mapper.Map<ProductResponse>(fullProduct);
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
            throw new NotFoundException("Category");

        if (category.ParentId is null)
            throw new BadRequestException("Category must be a subcategory");
    }

    #endregion

}