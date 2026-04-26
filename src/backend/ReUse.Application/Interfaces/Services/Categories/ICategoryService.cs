using ReUse.Application.DTOs.Categories.Commands;
using ReUse.Application.DTOs.Categories.Contracts;

namespace ReUse.Application.Interfaces.Services.Categories;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(bool activeOnly);
    Task<CategoryDto?> GetByIdAsync(Guid id);
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto);
    Task DeleteAsync(Guid id);
}