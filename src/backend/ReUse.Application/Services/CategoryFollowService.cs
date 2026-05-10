using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;

namespace ReUse.Application.Services;

public class CategoryFollowService : ICategoryFollowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CategoryFollowService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task FollowAsync(Guid userId, Guid categoryId)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("Invalid userId");

        if (categoryId == Guid.Empty)
            throw new BadRequestException("Invalid categoryId");

        var categoryExists = await _unitOfWork.Category.ExistsAsync(categoryId);
        if (!categoryExists)
            throw new NotFoundException("Category");

        var isFollowing = await _unitOfWork.CategoryFollow.IsFollowingAsync(userId, categoryId);
        if (isFollowing)
            throw new ConflictException("Already following this category");

        var follow = new CategoryFollow
        {
            UserId = userId,
            CategoryId = categoryId
        };

        _unitOfWork.CategoryFollow.Add(follow);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UnfollowAsync(Guid userId, Guid categoryId)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("Invalid userId");

        if (categoryId == Guid.Empty)
            throw new BadRequestException("Invalid categoryId");

        var follow = await _unitOfWork.CategoryFollow.GetFollowAsync(userId, categoryId);
        if (follow is null)
            throw new NotFoundException("You are not following this category");

        _unitOfWork.CategoryFollow.Remove(follow);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PagedResult<CategoryFollowResponse>> GetFollowedCategoriesAsync(
        Guid userId, PaginationParams pagination)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("Invalid userId");

        var follows = await _unitOfWork.CategoryFollow.GetFollowedCategoriesAsync(userId, pagination);

        var mappedItems = _mapper.Map<List<CategoryFollowResponse>>(follows.Data);
        return new PagedResult<CategoryFollowResponse>
        {
            Data = mappedItems,
            PageNumber = follows.PageNumber,
            PageSize = follows.PageSize,
            TotalRecords = follows.TotalRecords
        };
    }
}