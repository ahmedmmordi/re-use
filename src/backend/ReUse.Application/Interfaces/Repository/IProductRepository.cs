using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IProductRepository : IBaseRepository<Product>
{
    Task<PagedResult<Product>> GetAllAsync(ProductFilterParams filterParams);
    Task<Product?> GetProductDetailsAsync(Guid productId);
    Task<Dictionary<Guid, int>> GetActiveCountsByCategoryAsync();
    Task<int> GetActiveCountForCategoryAsync(Guid categoryId);

    Task<PagedResult<Product>> GetMyListingsAsync(Guid ownerId, MyListingsParams filterParams);
    Task<SellerSummary> GetSellerSummaryAsync(Guid ownerId);

    Task<PagedResult<Product>> GetPublicProductsByUserAsync(Guid ownerId, ProductFilterParams filterParams);

    Task<PagedResult<Product>> GetAllForAdminAsync(AdminProductFilterParams filterParams);
    Task<Product?> GetForAdminByIdAsync(Guid productId);
    Task<AdminProductsSummary> GetAdminSummaryAsync();
}