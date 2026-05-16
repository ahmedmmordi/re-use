using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Follows;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.DTOs.Users;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;


namespace ReUse.Application.Services;

public class FollowService : IFollowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationPublisher _notificationPublisher;
    public FollowService(IUnitOfWork unitOfWork, IMapper mapper, INotificationPublisher notificationPublisher)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationPublisher = notificationPublisher;
    }
    public async Task<PagedResult<FollowDto>> GetFollowersAsync(Guid userId, UserFilterParams filterParams)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followers = await _unitOfWork.Follow.GetFollowersAsync(userId, filterParams);

        return followers;
    }

    public async Task<PagedResult<FollowDto>> GetFollowingsAsync(Guid userId, UserFilterParams filterParams)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followings = await _unitOfWork.Follow.GetFollowingsAsync(userId, filterParams);

        return followings;
    }
    public async Task<FollowResultDto> FollowAsync(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
            throw new BadRequestException("You cannot follow yourself.");

        var targetUser = await _unitOfWork.User.GetByIdAsync(targetUserId)
            ?? throw new NotFoundException(nameof(User));

        var alreadyFollowing = await _unitOfWork.Follow
            .IsAlreadyFollowingAsync(currentUserId, targetUserId);

        if (alreadyFollowing)
            throw new ConflictException("You are already following this user.");

        var follow = new Follow
        {
            FollowerId = currentUserId,
            FollowingId = targetUserId,
            CreatedAt = DateTime.UtcNow
        };

        _unitOfWork.Follow.Add(follow);
        await _unitOfWork.SaveChangesAsync();

        // notification 
        await _notificationPublisher.PublishAsync<FollowNotificationData>(
         userId: targetUserId,
         type: NotificationType.FollowActivity,
         title: "New Follow",
         body: "Someone followed you",
          data: new FollowNotificationData
          {
              FollowerId = currentUserId,
              Username = (await _unitOfWork.User.GetByIdAsync(currentUserId))!.FullName
          }
          );

        // Populate navigation property => AutoMapper can read FollowingUser
        follow.FollowingUser = targetUser;

        var result = _mapper.Map<FollowResultDto>(follow);
        return result;
    }

    public async Task UnfollowAsync(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
            throw new BadRequestException("You cannot unfollow yourself.");

        var follow = await _unitOfWork.Follow.GetFollowAsync(currentUserId, targetUserId)
            ?? throw new NotFoundException("You are not following this user or the user does not exist.");

        _unitOfWork.Follow.Remove(follow);
        await _unitOfWork.SaveChangesAsync();

    }

    public async Task RemoveFollowerAsync(Guid currentUserId, Guid followerUserId)
    {
        if (currentUserId == followerUserId)
            throw new BadRequestException("You cannot remove yourself as a follower.");

        var follow = await _unitOfWork.Follow.GetFollowAsync(followerUserId, currentUserId)
            ?? throw new NotFoundException("This user is not following you.");

        var followerName = follow.FollowerUser.FullName;
        var removedId = follow.FollowerUser.Id;

        _unitOfWork.Follow.Remove(follow);
        await _unitOfWork.SaveChangesAsync();

    }

}