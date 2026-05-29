using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IFeedbackRepository : IBaseRepository<Domain.Entities.Feedback>
{
    Task<bool> ExistsForProductByRaterAsync(Guid productId, Guid raterUserId);

    Task<PagedResult<FeedbackResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc);

    Task<List<FeedbackResponse>> GetByProductIdAsync(Guid productId);

    Task<PagedResult<FeedbackResponse>> GetAllAsync(AdminFeedbackFilterParams filterParams);

    Task<Domain.Entities.Feedback?> GetActiveByIdAsync(Guid feedbackId);

    Task<(decimal Average, int Count)> ComputeAggregatesForUserAsync(Guid userId);

    Task ApplyAggregatesToUserAsync(Guid userId, decimal average, int count);
}