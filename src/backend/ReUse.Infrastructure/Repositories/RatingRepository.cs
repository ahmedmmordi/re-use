using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class RatingRepository : BaseRepository<UserRating>, IRatingRepository
{
    private readonly ApplicationDbContext _context;

    public RatingRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<bool> ExistsForProductByRaterAsync(Guid productId, Guid raterUserId)
    {
        return await _context.UserRatings
            .AsNoTracking()
            .AnyAsync(r => r.ProductId == productId && r.RaterUserId == raterUserId);
    }

    public async Task<PagedResult<RatingResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var query = _context.UserRatings
            .AsNoTracking()
            .Where(r => r.RateeUserId == userId);

        query = sortDirection == SortDirection.Asc
            ? query.OrderBy(r => r.CreatedAt)
            : query.OrderByDescending(r => r.CreatedAt);

        return await query
            .Select(r => new RatingResponse
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductTitle = r.Product.Title,
                Stars = r.Stars,
                CreatedAt = r.CreatedAt,
                Rater = new RatingUserResponse
                {
                    Id = r.Rater.Id,
                    FullName = r.Rater.FullName,
                    ProfileImageUrl = r.Rater.ProfileImageUrl
                },
                Ratee = new RatingUserResponse
                {
                    Id = r.Ratee.Id,
                    FullName = r.Ratee.FullName,
                    ProfileImageUrl = r.Ratee.ProfileImageUrl
                }
            })
            .ToPagedListAsync(pagination.PageNumber, pagination.PageSize);
    }

    public async Task<List<RatingResponse>> GetByProductIdAsync(Guid productId)
    {
        return await _context.UserRatings
            .AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new RatingResponse
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductTitle = r.Product.Title,
                Stars = r.Stars,
                CreatedAt = r.CreatedAt,
                Rater = new RatingUserResponse
                {
                    Id = r.Rater.Id,
                    FullName = r.Rater.FullName,
                    ProfileImageUrl = r.Rater.ProfileImageUrl
                },
                Ratee = new RatingUserResponse
                {
                    Id = r.Ratee.Id,
                    FullName = r.Ratee.FullName,
                    ProfileImageUrl = r.Ratee.ProfileImageUrl
                }
            })
            .ToListAsync();
    }

    public async Task<(decimal Average, int Count)> ComputeAggregatesForUserAsync(Guid userId)
    {
        var aggregates = await _context.UserRatings
            .AsNoTracking()
            .Where(r => r.RateeUserId == userId)
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
}