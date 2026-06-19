using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IProductService
{
    public Task<ProductResponse> CreateRegularProductAsync(CreateRegularProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateSwapProductAsync(CreateSwapProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateWantedProductAsync(CreateWantedProductRequest request, Guid sellerId);

    Task UpdateRegularProductAsync(Guid productId, UpdateRegularProductRequest request, Guid userId, bool isAdmin = false);
    Task UpdateSwapProductAsync(Guid productId, UpdateSwapProductRequest request, Guid userId, bool isAdmin = false);
    Task UpdateWantedProductAsync(Guid productId, UpdateWantedProductRequest request, Guid userId, bool isAdmin = false);


    Task<ProductDetailsResponse> GetByIdAsync(Guid productId);

    Task<PagedResult<ProductResponse>> GetAllProductsAsync(ProductFilterParams filterParams, Guid? userId = null);

    Task<SellerDashboardResponse> GetMyListingsAsync(Guid userId, MyListingsParams filterParams);

    Task<PagedResult<ProductResponse>> GetPublicProductsByUserAsync(Guid ownerId, ProductFilterParams filter);

    Task DeleteProductAsync(Guid productId, Guid userId, bool isAdmin = false);

    // Admin
    Task<PagedResult<ProductResponse>> GetAllForAdminAsync(AdminProductFilterParams filterParams);
    Task<ProductDetailsResponse> GetForAdminByIdAsync(Guid productId);
    Task<AdminProductsSummaryResponse> GetAdminSummaryAsync();

    Task ChangeProductStatusByAdminAsync(Guid productId, ProductStatus status);
    Task RestoreProductByAdminAsync(Guid productId);

    // Task CloseProductAsync(Guid productId, Guid userId, CloseProductRequest request);
    //
    // Task ConfirmDealAsync(Guid dealId, Guid userId);
    //
    // Task RejectDealAsync(Guid dealId, Guid userId);
    //
    // Task<List<ProductDeal>> GetMyDealsAsync(Guid userId);
}