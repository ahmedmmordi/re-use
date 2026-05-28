using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.DTOs.Ratings;
using ReUse.Application.Enums;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class RatingService : IRatingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationPublisher _notificationPublisher;

    public RatingService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INotificationPublisher notificationPublisher)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationPublisher = notificationPublisher;
    }

    #region CREATE
    public async Task<RatingResponse> CreateAsync(Guid productId, Guid raterUserId, CreateRatingRequest request)
    {
        if (raterUserId == request.RateeUserId)
            throw new BadRequestException("You cannot rate yourself.");

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

        if (await _unitOfWork.Ratings.ExistsForProductByRaterAsync(productId, raterUserId))
            throw new ConflictException("Rating");

        var rating = new UserRating
        {
            ProductId = productId,
            RaterUserId = raterUserId,
            RateeUserId = request.RateeUserId,
            Stars = request.Stars
        };

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            _unitOfWork.Ratings.Add(rating);
            await _unitOfWork.SaveChangesAsync();

            var (average, count) = await _unitOfWork.Ratings.ComputeAggregatesForUserAsync(request.RateeUserId);
            ratee.RatingsAverage = average;
            ratee.RatingsCount = count;
            _unitOfWork.User.Update(ratee);
            await _unitOfWork.SaveChangesAsync();

            await _unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        await _notificationPublisher.PublishAsync<RatingReceivedNotificationData>(
            userId: request.RateeUserId,
            type: NotificationType.RatingReceived,
            title: "New Rating",
            body: $"{rater.FullName} rated you {request.Stars} star{(request.Stars == 1 ? string.Empty : "s")}",
            data: new RatingReceivedNotificationData
            {
                RaterId = raterUserId,
                RaterName = rater.FullName,
                ProductId = productId,
                RatingId = rating.Id,
                Stars = request.Stars
            }
        );

        return new RatingResponse
        {
            Id = rating.Id,
            ProductId = rating.ProductId,
            ProductTitle = product.Title,
            Stars = rating.Stars,
            CreatedAt = rating.CreatedAt,
            Rater = new RatingUserResponse
            {
                Id = rater.Id,
                FullName = rater.FullName,
                ProfileImageUrl = rater.ProfileImageUrl
            },
            Ratee = new RatingUserResponse
            {
                Id = ratee.Id,
                FullName = ratee.FullName,
                ProfileImageUrl = ratee.ProfileImageUrl
            }
        };
    }
    #endregion

    #region GET received
    public async Task<PagedResult<RatingResponse>> GetReceivedByUserAsync(
        Guid userId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        if (user is null)
            throw new NotFoundException("User");

        return await _unitOfWork.Ratings.GetReceivedByUserAsync(userId, pagination, sortDirection);
    }
    #endregion

    #region GET by product
    public async Task<List<RatingResponse>> GetByProductIdAsync(Guid productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product is null || product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");

        return await _unitOfWork.Ratings.GetByProductIdAsync(productId);
    }
    #endregion

    #region GET summary
    public async Task<UserRatingSummaryResponse> GetUserSummaryAsync(Guid userId)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        if (user is null)
            throw new NotFoundException("User");

        return new UserRatingSummaryResponse
        {
            Average = user.RatingsAverage,
            Count = user.RatingsCount
        };
    }
    #endregion

    #region Helper
    private async Task<Product> RequireClosedProductAsync(Guid productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product is null || product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");

        if (product.Status != ProductStatus.Closed)
            throw new BadRequestException("You can only rate after the product is closed.");

        return product;
    }
    #endregion
}