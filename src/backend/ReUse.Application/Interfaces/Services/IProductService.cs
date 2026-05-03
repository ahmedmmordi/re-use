using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IProductService
{
    public Task<ProductResponse> CreateRegularProductAsync(CreateRegularProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateSwapProductAsync(CreateSwapProductRequest request, Guid sellerId);
    public Task<ProductResponse> CreateWantedProductAsync(CreateWantedProductRequest request, Guid sellerId);

    Task<ProductDetailsResponse> GetByIdAsync(Guid productId);

}