using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IProductImageRepository : IBaseRepository<ProductImage>
{
    Task<List<ProductImage>> GetByProductIdAsync(Guid productId);

    Task<int> CountByProductIdAsync(Guid productId);

    Task<List<ProductImage>> GetByPublicIdsAsync(IEnumerable<string> publicIds);

    Task<List<ProductImage>> GetByIdsAsync(IEnumerable<Guid> ids);
}