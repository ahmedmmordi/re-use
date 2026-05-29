using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IFeedbackService
{
    Task<FeedbackResponse> CreateAsync(Guid productId, Guid raterUserId, CreateFeedbackRequest request);

    Task<PagedResult<FeedbackResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc);

    Task<List<FeedbackResponse>> GetByProductIdAsync(Guid productId);

    Task<UserFeedbackSummaryResponse> GetUserSummaryAsync(Guid userId);

    Task<PagedResult<FeedbackResponse>> GetAllForAdminAsync(AdminFeedbackFilterParams filterParams);

    Task SoftDeleteAsync(Guid feedbackId);
}