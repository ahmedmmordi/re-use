using AutoMapper;

using Microsoft.Extensions.Logging;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Feedback;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Enums;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class FeedbackService : IFeedbackService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationPublisher _notificationPublisher;
    private readonly ILogger<FeedbackService> _logger;

    public FeedbackService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INotificationPublisher notificationPublisher,
        ILogger<FeedbackService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationPublisher = notificationPublisher;
        _logger = logger;
    }

    #region CREATE
    public async Task<FeedbackResponse> CreateAsync(Guid productId, Guid raterUserId, CreateFeedbackRequest request)
    {
        if (raterUserId == request.RateeUserId)
            throw new BadRequestException("You cannot leave feedback for yourself.");

        var product = await RequireClosedProductAsync(productId);

        var rater = await _unitOfWork.User.GetByIdAsync(raterUserId);
        if (rater is null || !rater.IsActive)
            throw new ForbiddenException("Your account is deactivated.");

        var ratee = await _unitOfWork.User.GetByIdAsync(request.RateeUserId);
        if (ratee is null)
            throw new NotFoundException("Ratee user");

        // TODO: once the closing flow lands and Product stamps the accepted buyer,
        // verify the rater is either product.OwnerUserId or product.AcceptedBuyerUserId,
        // and that the ratee is the other party. For now we accept any active user as rater.

        if (await _unitOfWork.Feedback.ExistsForProductByRaterAsync(productId, raterUserId))
            throw new ConflictException("Feedback");

        var feedback = new Domain.Entities.Feedback
        {
            ProductId = productId,
            RaterUserId = raterUserId,
            RateeUserId = request.RateeUserId,
            Stars = request.Stars,
            Comment = request.Comment
        };

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            _unitOfWork.Feedback.Add(feedback);
            await _unitOfWork.SaveChangesAsync();

            var (average, count) = await _unitOfWork.Feedback.ComputeAggregatesForUserAsync(request.RateeUserId);
            await _unitOfWork.Feedback.ApplyAggregatesToUserAsync(request.RateeUserId, average, count);
            ratee.RatingsAverage = average;
            ratee.RatingsCount = count;

            await _unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        // Feedback is already committed, notification delivery is best-effort and must not
        // fail the request, otherwise client retries hit the duplicate-feedback conflict
        try
        {
            await _notificationPublisher.PublishAsync<FeedbackReceivedNotificationData>(
                userId: request.RateeUserId,
                type: NotificationType.FeedbackReceived,
                title: "New Feedback",
                body: $"{rater.FullName} rated you {request.Stars} star{(request.Stars == 1 ? string.Empty : "s")}",
                data: new FeedbackReceivedNotificationData
                {
                    RaterId = raterUserId,
                    RaterName = rater.FullName,
                    ProductId = productId,
                    FeedbackId = feedback.Id,
                    Stars = request.Stars
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to publish feedback notification to ratee {RateeUserId} for feedback {FeedbackId}",
                request.RateeUserId,
                feedback.Id);
        }

        return new FeedbackResponse
        {
            Id = feedback.Id,
            ProductId = feedback.ProductId,
            ProductTitle = product.Title,
            Stars = feedback.Stars,
            Comment = feedback.Comment,
            CreatedAt = feedback.CreatedAt,
            Rater = new FeedbackUserResponse
            {
                Id = rater.Id,
                FullName = rater.FullName,
                ProfileImageUrl = rater.ProfileImageUrl
            },
            Ratee = new FeedbackUserResponse
            {
                Id = ratee.Id,
                FullName = ratee.FullName,
                ProfileImageUrl = ratee.ProfileImageUrl
            }
        };
    }
    #endregion

    #region GET received
    public async Task<PagedResult<FeedbackResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        if (user is null)
            throw new NotFoundException("User");

        return await _unitOfWork.Feedback.GetReceivedByUserAsync(userId, pagination, sortDirection);
    }
    #endregion

    #region GET by product
    public async Task<List<FeedbackResponse>> GetByProductIdAsync(Guid productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product is null || product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");

        return await _unitOfWork.Feedback.GetByProductIdAsync(productId);
    }
    #endregion

    #region GET summary
    public async Task<UserFeedbackSummaryResponse> GetUserSummaryAsync(Guid userId)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        if (user is null)
            throw new NotFoundException("User");

        return new UserFeedbackSummaryResponse
        {
            Average = user.RatingsAverage,
            Count = user.RatingsCount
        };
    }
    #endregion

    #region GET all (admin)
    public async Task<PagedResult<FeedbackResponse>> GetAllForAdminAsync(AdminFeedbackFilterParams filterParams)
    {
        return await _unitOfWork.Feedback.GetAllAsync(filterParams);
    }
    #endregion

    #region Soft-delete (admin)
    public async Task SoftDeleteAsync(Guid feedbackId)
    {
        var feedback = await _unitOfWork.Feedback.GetActiveByIdAsync(feedbackId);
        if (feedback is null)
            throw new NotFoundException("Feedback");

        var rateeUserId = feedback.RateeUserId;

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            feedback.IsDeleted = true;
            feedback.DeletedAt = DateTime.UtcNow;
            _unitOfWork.Feedback.Update(feedback);
            await _unitOfWork.SaveChangesAsync();

            var (average, count) = await _unitOfWork.Feedback.ComputeAggregatesForUserAsync(rateeUserId);
            await _unitOfWork.Feedback.ApplyAggregatesToUserAsync(rateeUserId, average, count);

            await _unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }
    #endregion

    #region Helper
    private async Task<Product> RequireClosedProductAsync(Guid productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product is null || product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");

        if (product.Status != ProductStatus.Closed)
            throw new BadRequestException("You can only leave feedback after the product is closed.");

        return product;
    }
    #endregion
}