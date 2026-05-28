using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IRatingService
{
    Task<RatingResponse> CreateAsync(Guid productId, Guid raterUserId, CreateRatingRequest request);

    Task<PagedResult<RatingResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc);

    Task<List<RatingResponse>> GetByProductIdAsync(Guid productId);

    Task<UserRatingSummaryResponse> GetUserSummaryAsync(Guid userId);
}