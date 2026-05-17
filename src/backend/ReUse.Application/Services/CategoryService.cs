using AutoMapper;

using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;


namespace ReUse.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICloudinaryService _cloudinary;
    private readonly IImageValidator _imageValidator;


    public CategoryService(
        IUnitOfWork unitOfWork,
        IMapper mapper, ICloudinaryService cloudinary,       // add
        IImageValidator imageValidator)       // add)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cloudinary = cloudinary;
        _imageValidator = imageValidator;
    }

    public async Task<PagedResult<CategoryResponse>> GetCategoriesAsync(CategoriesFilterParams filterParams)
    {
        var categories = await _unitOfWork.Category.GetAllAsync(filterParams);

        var dtoList = _mapper.Map<List<CategoryResponse>>(categories.Data);

        var counts = await _unitOfWork.Product.GetActiveCountsByCategoryAsync();
        dtoList = dtoList.Select(d => d with { ProductCount = counts.GetValueOrDefault(d.Id, 0) }).ToList();

        return new PagedResult<CategoryResponse>
        {
            Data = dtoList,
            PageNumber = categories.PageNumber,
            PageSize = categories.PageSize,
            TotalRecords = categories.TotalRecords
        };
    }

    public async Task<List<CategoryResponse>> GetCategoryTreeAsync(bool includeInactive = false)
    {
        var categories = await _unitOfWork.Category.GetAllAsync();

        if (!includeInactive)
        {
            categories = categories.Where(c => c.IsActive).ToList();
        }

        var dtos = _mapper.Map<List<CategoryResponse>>(categories);

        var counts = await _unitOfWork.Product.GetActiveCountsByCategoryAsync();
        dtos = dtos.Select(d => d with { ProductCount = counts.GetValueOrDefault(d.Id, 0) }).ToList();

        var lookup = dtos.ToDictionary(c => c.Id);

        var roots = new List<CategoryResponse>();

        foreach (var dto in dtos)
        {
            if (dto.ParentId == null)
            {
                roots.Add(dto);
            }
            else if (lookup.TryGetValue(dto.ParentId.Value, out var parent))
            {
                parent.Subcategories.Add(dto);
            }
        }

        return roots;
    }

    public async Task<CategoryResponse?> GetByIdAsync(Guid id)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id);

        if (category == null)
            throw new NotFoundException("Category not found");

        var dto = _mapper.Map<CategoryResponse>(category);

        var count = await _unitOfWork.Product.GetActiveCountForCategoryAsync(id);
        dto = dto with { ProductCount = count };

        return dto;
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        if (request.ParentId.HasValue)
        {
            var parentExists = await _unitOfWork.Category.ExistsAsync(request.ParentId.Value);

            if (!parentExists)
                throw new NotFoundException("Parent category not found");
        }

        if (await _unitOfWork.Category.NameExistsAsync(request.Name))
        {
            throw new ConflictException("Category name already exists");
        }

        if (await _unitOfWork.Category.SlugExistsAsync(request.Slug))
        {
            throw new ConflictException("Category slug already exists");
        }

        var category = _mapper.Map<Category>(request);

        _unitOfWork.Category.Add(category);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CategoryResponse>(category);
    }

    public async Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id);

        if (category == null)
            throw new NotFoundException("Category not found");

        if (request.ParentId.HasValue)
        {
            if (request.ParentId == id)
                throw new ConflictException("Category cannot be its own parent");

            var parentExists = await _unitOfWork.Category.ExistsAsync(request.ParentId.Value);

            if (!parentExists)
                throw new NotFoundException("Parent category not found");
        }

        if (!string.IsNullOrWhiteSpace(request.Name) && await _unitOfWork.Category.NameExistsAsync(request.Name, category.Id))
        {
            throw new ConflictException("Category name already exists");
        }

        if (!string.IsNullOrWhiteSpace(request.Slug) && await _unitOfWork.Category.SlugExistsAsync(request.Slug, category.Id))
        {
            throw new ConflictException("Category slug already exists");
        }

        _mapper.Map(request, category);

        category.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Category.Update(category);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CategoryResponse>(category);
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id);

        if (category == null)
            throw new NotFoundException("Category not found");

        _unitOfWork.Category.Remove(category);

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<CategoryResponse> UploadIconAsync(Guid id, IFormFile file)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id);
        if (category == null)
            throw new NotFoundException("Category not found");

        _imageValidator.Validate(file);

        // Delete old icon from Cloudinary if one exists
        if (!string.IsNullOrWhiteSpace(category.IconPublicId))
            await _cloudinary.DeleteAsync(category.IconPublicId);

        var uploaded = await _cloudinary.UpdateAsync(file, $"categories/{id}");

        category.IconUrl = uploaded.Url;
        category.IconPublicId = uploaded.PublicId;
        category.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Category.Update(category);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CategoryResponse>(category);
    }

}