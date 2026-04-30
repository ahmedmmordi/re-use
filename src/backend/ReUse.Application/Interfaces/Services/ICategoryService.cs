
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;

namespace ReUse.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<PagedResult<CategoryResponse>> GetCategoriesAsync(CategoriesFilterParams filterParams);
    Task<List<CategoryResponse>> GetCategoryTreeAsync();
    Task<CategoryResponse?> GetByIdAsync(Guid id);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request);
    Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest request);
    Task DeleteAsync(Guid id);
}