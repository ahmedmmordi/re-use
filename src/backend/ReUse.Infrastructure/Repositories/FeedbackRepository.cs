using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class FeedbackRepository : BaseRepository<Domain.Entities.Feedback>, IFeedbackRepository
{
    private readonly ApplicationDbContext _context;

    public FeedbackRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<bool> ExistsForProductByRaterAsync(Guid productId, Guid raterUserId)
    {
        return await _context.Feedbacks
            .AsNoTracking()
            .AnyAsync(r => r.ProductId == productId && r.RaterUserId == raterUserId && !r.IsDeleted);
    }

    public async Task<PagedResult<FeedbackResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var query = _context.Feedbacks
            .AsNoTracking()
            .Where(r => r.RateeUserId == userId && !r.IsDeleted);

        query = sortDirection == SortDirection.Asc
            ? query.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
            : query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id);

        return await query
            .Select(r => new FeedbackResponse
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductTitle = r.Product.Title,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Rater = new FeedbackUserResponse
                {
                    Id = r.Rater.Id,
                    FullName = r.Rater.FullName,
                    ProfileImageUrl = r.Rater.ProfileImageUrl
                },
                Ratee = new FeedbackUserResponse
                {
                    Id = r.Ratee.Id,
                    FullName = r.Ratee.FullName,
                    ProfileImageUrl = r.Ratee.ProfileImageUrl
                }
            })
            .ToPagedListAsync(pagination.PageNumber, pagination.PageSize);
    }

    public async Task<List<FeedbackResponse>> GetByProductIdAsync(Guid productId)
    {
        return await _context.Feedbacks
            .AsNoTracking()
            .Where(r => r.ProductId == productId && !r.IsDeleted)
            .OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
            .Select(r => new FeedbackResponse
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductTitle = r.Product.Title,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Rater = new FeedbackUserResponse
                {
                    Id = r.Rater.Id,
                    FullName = r.Rater.FullName,
                    ProfileImageUrl = r.Rater.ProfileImageUrl
                },
                Ratee = new FeedbackUserResponse
                {
                    Id = r.Ratee.Id,
                    FullName = r.Ratee.FullName,
                    ProfileImageUrl = r.Ratee.ProfileImageUrl
                }
            })
            .ToListAsync();
    }

    public async Task<PagedResult<FeedbackResponse>> GetAllAsync(AdminFeedbackFilterParams filterParams)
    {
        var query = _context.Feedbacks
            .AsNoTracking()
            .Where(r => !r.IsDeleted);

        if (filterParams.ProductId.HasValue)
            query = query.Where(r => r.ProductId == filterParams.ProductId.Value);

        if (filterParams.RaterUserId.HasValue)
            query = query.Where(r => r.RaterUserId == filterParams.RaterUserId.Value);

        if (filterParams.RateeUserId.HasValue)
            query = query.Where(r => r.RateeUserId == filterParams.RateeUserId.Value);

        if (filterParams.MinStars.HasValue)
            query = query.Where(r => r.Stars >= filterParams.MinStars.Value);

        if (filterParams.MaxStars.HasValue)
            query = query.Where(r => r.Stars <= filterParams.MaxStars.Value);

        if (filterParams.CreatedFrom.HasValue)
            query = query.Where(r => r.CreatedAt >= filterParams.CreatedFrom.Value);

        if (filterParams.CreatedTo.HasValue)
            query = query.Where(r => r.CreatedAt <= filterParams.CreatedTo.Value);

        query = filterParams.SortDirection == SortDirection.Asc
            ? query.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
            : query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id);

        return await query
            .Select(r => new FeedbackResponse
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductTitle = r.Product.Title,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Rater = new FeedbackUserResponse
                {
                    Id = r.Rater.Id,
                    FullName = r.Rater.FullName,
                    ProfileImageUrl = r.Rater.ProfileImageUrl
                },
                Ratee = new FeedbackUserResponse
                {
                    Id = r.Ratee.Id,
                    FullName = r.Ratee.FullName,
                    ProfileImageUrl = r.Ratee.ProfileImageUrl
                }
            })
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize);
    }

    public async Task<Domain.Entities.Feedback?> GetActiveByIdAsync(Guid feedbackId)
    {
        return await _context.Feedbacks
            .FirstOrDefaultAsync(r => r.Id == feedbackId && !r.IsDeleted);
    }

    public async Task<(decimal Average, int Count)> ComputeAggregatesForUserAsync(Guid userId)
    {
        var aggregates = await _context.Feedbacks
            .AsNoTracking()
            .Where(r => r.RateeUserId == userId && !r.IsDeleted)
            .GroupBy(r => 1)
            .Select(g => new
            {
                Count = g.Count(),
                Sum = (decimal)g.Sum(r => r.Stars)
            })
            .FirstOrDefaultAsync();

        if (aggregates is null || aggregates.Count == 0)
            return (0m, 0);

        var average = Math.Round(aggregates.Sum / aggregates.Count, 1, MidpointRounding.AwayFromZero);
        return (average, aggregates.Count);
    }

    public async Task ApplyAggregatesToUserAsync(Guid userId, decimal average, int count)
    {
        await _context.Set<User>()
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.RatingsAverage, average)
                .SetProperty(u => u.RatingsCount, count));
    }
}