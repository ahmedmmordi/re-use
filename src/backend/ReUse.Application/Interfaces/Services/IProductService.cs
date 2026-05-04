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

namespace ReUse.Application.Interfaces.Services;

public interface IProductService
{
    public Task<ProductResponse> CreateRegularProductAsync(CreateRegularProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateSwapProductAsync(CreateSwapProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateWantedProductAsync(CreateWantedProductRequest request, Guid sellerId);

    Task<ProductResponse> UpdateRegularProductAsync(Guid productId, UpdateRegularProductRequest request, Guid userId);
    Task<ProductResponse> UpdateSwapProductAsync(Guid productId, UpdateSwapProductRequest request, Guid userId);
    Task<ProductResponse> UpdateWantedProductAsync(Guid productId, UpdateWantedProductRequest request, Guid userId);


    Task<ProductDetailsResponse> GetByIdAsync(Guid productId);

    Task<PagedResult<ProductResponse>> GetAllProductsAsync(ProductFilterParams filterParams);

    Task DeleteProductAsync(Guid productId, Guid userId);


}