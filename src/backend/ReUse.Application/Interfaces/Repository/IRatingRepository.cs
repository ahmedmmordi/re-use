using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IRatingRepository : IBaseRepository<UserRating>
{
    Task<bool> ExistsForProductByRaterAsync(Guid productId, Guid raterUserId);

    Task<PagedResult<RatingResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc);

    Task<List<RatingResponse>> GetByProductIdAsync(Guid productId);

    Task<(decimal Average, int Count)> ComputeAggregatesForUserAsync(Guid userId);
}