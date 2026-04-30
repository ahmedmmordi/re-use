using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;

public class CategoryRepository : BaseRepository<Category>, ICategoryRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<PagedResult<Category>> GetAllAsync(CategoriesFilterParams filterParams, CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .AsNoTracking()
            .Search(filterParams.SearchTerm)
            .FilterByParent(filterParams.ParentId)
            .FilterByActive(filterParams.IsActive)
            .ApplySort(filterParams.SortBy, filterParams.SortOrder)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize, cancellationToken);
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _context.Categories
            .AsNoTracking()
            .ToListAsync();
    }

    // ← added: replaces direct DbContext access in CategoryService
    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Categories
            .AnyAsync(c => c.Id == id);
    }

    public async Task<bool> NameExistsAsync(string name, Guid? id = null)
    {
        return await _context.Categories
            .AnyAsync(c => c.Name == name && c.Id != id);
    }

    public async Task<bool> SlugExistsAsync(string slug, Guid? id = null)
    {
        return await _context.Categories
            .AnyAsync(c => c.Slug == slug && c.Id != id);
    }
}