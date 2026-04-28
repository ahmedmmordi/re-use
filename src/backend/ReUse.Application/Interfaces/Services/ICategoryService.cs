
using ReUse.Application.DTOs.Categories;

namespace ReUse.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetAllAsync(bool activeOnly);
    Task<CategoryResponse?> GetByIdAsync(Guid id);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest dto);
    Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest dto);
    Task DeleteAsync(Guid id);
}