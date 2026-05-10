using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface ICategoryFollowRepository : IBaseRepository<CategoryFollow>
{
    Task<bool> IsFollowingAsync(Guid userId, Guid categoryId);
    Task<CategoryFollow?> GetFollowAsync(Guid userId, Guid categoryId);
    Task<PagedResult<CategoryFollow>> GetFollowedCategoriesAsync(Guid userId, PaginationParams pagination);
}