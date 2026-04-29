using AutoMapper;

using ReUse.Application.DTOs.Categories;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;

namespace ReUse.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;


    public CategoryService(
        ICategoryRepository repo,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // ==============================
    // GET ALL (TREE)
    // ==============================
    public async Task<List<CategoryResponse>> GetAllAsync(bool activeOnly)
    {
        var categories = await _repo.GetAllAsync();

        if (activeOnly)
            categories = categories.Where(c => c.IsActive).ToList();

        var lookup = categories.ToDictionary(c => c.Id);

        var rootCategories = new List<Category>();

        foreach (var category in categories)
        {
            if (category.ParentId == null)
            {
                rootCategories.Add(category);
            }
            else if (lookup.TryGetValue(category.ParentId.Value, out var parent))
            {
                parent.Subcategories.Add(category);
            }
        }

        var result = _mapper.Map<List<CategoryResponse>>(rootCategories);

        return result;
    }

    // ==============================
    // GET BY ID
    // ==============================
    public async Task<CategoryResponse?> GetByIdAsync(Guid id)
    {
        var category = await _repo.GetByIdAsync(id);

        if (category == null)
            return null;

        var dto = _mapper.Map<CategoryResponse>(category);
        // TODO: set real ProductCount once Products entity is linked
        dto = dto with { ProductCount = 0 };

        return dto;
    }

    // ==============================
    // CREATE
    // ==============================
    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest dto)
    {
        if (dto.ParentId.HasValue)
        {
            // uses repo instead of raw DbContext
            var parentExists = await _repo.ExistsAsync(dto.ParentId.Value);

            if (!parentExists)
                throw new NotFoundException("Parent category not found");
        }

        var category = _mapper.Map<Category>(dto);

        category.Id = Guid.NewGuid();

        category.Name = category.Name.Trim();
        category.Slug = category.Slug.Trim().ToLower();

        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = null;

        await _repo.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CategoryResponse>(category);
    }

    // ==============================
    // UPDATE
    // ==============================
    public async Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest dto)
    {
        var category = await _repo.GetByIdAsync(id);

        if (category == null)
            throw new NotFoundException("Category not found");  // ← was: Exception

        _mapper.Map(dto, category);

        category.UpdatedAt = DateTime.UtcNow;

        _repo.Update(category);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CategoryResponse>(category);
    }

    // ==============================
    // DELETE
    // ==============================
    public async Task DeleteAsync(Guid id)
    {
        var category = await _repo.GetByIdAsync(id);

        if (category == null)
            throw new NotFoundException("Category not found");  // ← was: Exception

        _repo.Delete(category);
        await _unitOfWork.SaveChangesAsync();
    }

}