using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface ICategoryRepository : IBaseRepository<Category>
{
    Task<PagedResult<Category>> GetAllAsync(CategoriesFilterParams filterParams, CancellationToken cancellationToken = default);
    Task<List<Category>> GetAllAsync();
    Task<bool> ExistsAsync(Guid id);
    Task<bool> SlugExistsAsync(string slug, Guid? id = null);
    Task<bool> NameExistsAsync(string name, Guid? id = null);
}