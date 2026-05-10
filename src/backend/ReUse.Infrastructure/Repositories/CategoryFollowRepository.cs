using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class CategoryFollowRepository : BaseRepository<CategoryFollow>, ICategoryFollowRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryFollowRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<bool> IsFollowingAsync(Guid userId, Guid categoryId)
    {
        return await _context.CategoryFollows
            .AnyAsync(cf => cf.UserId == userId && cf.CategoryId == categoryId);
    }

    public async Task<CategoryFollow?> GetFollowAsync(Guid userId, Guid categoryId)
    {
        return await _context.CategoryFollows
            .FirstOrDefaultAsync(cf => cf.UserId == userId && cf.CategoryId == categoryId);
    }

    public async Task<PagedResult<CategoryFollow>> GetFollowedCategoriesAsync(
    Guid userId,
    PaginationParams pagination)
    {
        return await _context.CategoryFollows
            .AsNoTracking()
            .Where(cf => cf.UserId == userId)
            .Include(cf => cf.Category)
            .ToPagedListAsync(pagination.PageNumber, pagination.PageSize);
    }
}