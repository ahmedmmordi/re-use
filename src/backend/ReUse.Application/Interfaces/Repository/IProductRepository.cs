using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IProductRepository : IBaseRepository<Product>
{
    Task<PagedResult<Product>> GetAllAsync(ProductFilterParams filterParams);
    Task<Product?> GetProductDetailsAsync(Guid productId);
}