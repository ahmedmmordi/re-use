using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Comments;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Enums;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class CommentService : ICommentService
{
    private const int RateLimitWindowSeconds = 60;
    private const int RateLimitMaxComments = 3;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationPublisher _notificationPublisher;

    public CommentService(IUnitOfWork unitOfWork, IMapper mapper, INotificationPublisher notificationPublisher)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationPublisher = notificationPublisher;
    }



    #region GET list
    public async Task<PagedResult<CommentResponse>> GetProductCommentsAsync(
   Guid productId,
   PaginationParams pagination,
   SortDirection sortDirection = SortDirection.Desc)
    {
        await RequireActiveProductAsync(productId);
        return await _unitOfWork.Comments.GetByProductIdAsync(productId, pagination, sortDirection);
    }
    #endregion

    #region GET single 
    public async Task<CommentResponse> GetCommentByIdAsync(Guid productId, Guid commentId)
    {
        await RequireActiveProductAsync(productId);

        var comment = await _unitOfWork.Comments.GetByIdWithAuthorAsync(commentId);
        if (comment is null || comment.ProductId != productId)
            throw new NotFoundException("Comment");

        return comment;
    }
    #endregion

    #region GET replies
    public async Task<PagedResult<CommentResponse>> GetRepliesAsync(Guid productId, Guid commentId, PaginationParams pagination, SortDirection sortDirection = SortDirection.Asc)
    {
        await RequireActiveProductAsync(productId);

        // Verify parent comment exists and belongs to this product
        var parent = await _unitOfWork.Comments.GetByIdWithAuthorAsync(commentId);
        if (parent is null || parent.ProductId != productId)
            throw new NotFoundException("Comment");

        return await _unitOfWork.Comments.GetRepliesAsync(commentId, pagination, sortDirection);
    }
    #endregion


    #region ADD
    public async Task<CommentResponse> AddCommentAsync(Guid productId, Guid userId, CreateCommentRequest request)
    {
        var product = await RequireActiveProductAsync(productId);

        var user = await _unitOfWork.User.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            throw new ForbiddenException("Your account is deactivated.");

        // Validate parent comment when replying
        if (request.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.Comments.GetByIdWithAuthorAsync(request.ParentCommentId.Value);
            if (parent is null || parent.ProductId != productId)
                throw new NotFoundException("Parent comment");

            // Only allow one level of nesting replies to replies are not supported
            //if (parent.ParentCommentId.HasValue)
            //    throw new BadRequestException("Replies to replies are not supported.");
        }

        var since = DateTime.UtcNow.AddSeconds(-RateLimitWindowSeconds);
        var recentCount = await _unitOfWork.Comments
            .CountRecentCommentsByUserOnProductAsync(userId, productId, since);

        if (recentCount >= RateLimitMaxComments)
            throw new BadRequestException("Too many comments. Please wait before commenting again.");

        var comment = new ProductComment
        {
            ProductId = productId,
            UserId = userId,
            Body = request.Body.Trim(),
            ParentCommentId = request.ParentCommentId
        };

        _unitOfWork.Comments.Add(comment);
        await _unitOfWork.SaveChangesAsync();

        var saved = await _unitOfWork.Comments.GetCommentWithAuthorAsync(comment.Id);

        // Notify parent comment author when someone replies to their comment
        if (request.ParentCommentId.HasValue)
        {
            var parentComment = await _unitOfWork.Comments.GetCommentWithAuthorAsync(request.ParentCommentId.Value);
            if (parentComment is not null && parentComment.UserId != userId)
            {
                await _notificationPublisher.PublishAsync<CommentReplyNotificationData>(
                    userId: parentComment.UserId,
                    type: NotificationType.CommentReply,
                    title: "New Reply",
                    body: $"{user!.FullName} replied to your comment",
                    data: new CommentReplyNotificationData
                    {
                        ReplierId = userId,
                        ReplierName = user!.FullName,
                        ProductId = productId,
                        ParentCommentId = request.ParentCommentId.Value,
                        ReplyCommentId = comment.Id
                    }
                );
            }
        }

        return _mapper.Map<CommentResponse>(saved);
    }

    #endregion


    #region EDIT
    public async Task UpdateCommentAsync(Guid commentId, Guid requestingUserId, UpdateCommentRequest request)
    {
        var comment = await _unitOfWork.Comments.GetCommentWithAuthorAsync(commentId);
        if (comment == null || comment.IsDeleted)
            throw new NotFoundException("Comment");

        if (comment.UserId != requestingUserId)
            throw new ForbiddenException();

        comment.Body = request.Body.Trim();
        _unitOfWork.Comments.Update(comment);
        await _unitOfWork.SaveChangesAsync();
    }
    #endregion


    #region  DELETE
    public async Task DeleteCommentAsync(Guid commentId, Guid UserId)
    {
        var comment = await _unitOfWork.Comments.GetCommentWithAuthorAsync(commentId);
        if (comment == null || comment.IsDeleted)
            throw new NotFoundException("Comment");

        if (comment.UserId != UserId)
            throw new ForbiddenException();

        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        _unitOfWork.Comments.Update(comment);
        await _unitOfWork.SaveChangesAsync();
    }
    #endregion


    #region Helper
    private async Task<Product> RequireActiveProductAsync(Guid productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product is null || product.Status != ProductStatus.Active)
            throw new NotFoundException("Product");

        return product;
    }
    #endregion
}