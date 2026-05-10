using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Services;

public interface ICategoryFollowService
{
    Task FollowAsync(Guid userId, Guid categoryId);
    Task UnfollowAsync(Guid userId, Guid categoryId);
    Task<PagedResult<CategoryFollowResponse>> GetFollowedCategoriesAsync(Guid userId, PaginationParams pagination);
}