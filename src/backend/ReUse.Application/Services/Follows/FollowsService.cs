

using AutoMapper;

using ReUse.Application.DTOs.Users.Follows.Contracts;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.Follows;
using ReUse.Application.Options.Filters;
using ReUse.Domain.Entities;


namespace ReUse.Application.Services.Follows;

public class FollowsService : IFollowsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public FollowsService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<PaginatedList<FollowsDtos>> GetFollowersAsync(Guid userId, UserQueryOptions query)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followers = await _unitOfWork.Follows.GetFollowersAsync(userId, query);


        var mappedItems = _mapper.Map<List<FollowsDtos>>(followers.Items);


        return new PaginatedList<FollowsDtos>(
            mappedItems,
            followers.PageNumber,
            followers.TotalCount,
            followers.PageSize);
    }

    public async Task<PaginatedList<FollowsDtos>> GetFollowingsAsync(Guid userId, UserQueryOptions query)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followings = await _unitOfWork.Follows.GetFollowingsAsync(userId, query);

        var mappedItems = _mapper.Map<List<FollowsDtos>>(followings.Items);

        return new PaginatedList<FollowsDtos>(
            mappedItems,
            followings.PageNumber,
            followings.TotalCount,
            followings.PageSize);
    }
    public async Task<FollowResultDto> FollowAsync(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
            throw new BadRequestException("You cannot follow yourself.");

        var targetUser = await _unitOfWork.User.GetByIdAsync(targetUserId)
            ?? throw new NotFoundException(nameof(User));

        var alreadyFollowing = await _unitOfWork.Follows
            .IsAlreadyFollowingAsync(currentUserId, targetUserId);

        if (alreadyFollowing)
            throw new ConflictException("You are already following this user.");

        var follow = new Follow
        {
            FollowerId = currentUserId,
            FollowingId = targetUserId,
            CreatedAt = DateTime.UtcNow
        };

        _unitOfWork.Follows.Add(follow);
        await _unitOfWork.SaveChangesAsync();

        // Populate navigation property => AutoMapper can read FollowingUser
        follow.FollowingUser = targetUser;

        var result = _mapper.Map<FollowResultDto>(follow);
        return result;
    }

    public async Task UnfollowAsync(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
            throw new BadRequestException("You cannot unfollow yourself.");

        var follow = await _unitOfWork.Follows.GetFollowAsync(currentUserId, targetUserId)
            ?? throw new NotFoundException("You are not following this user or the user does not exist.");

        _unitOfWork.Follows.Remove(follow);
        await _unitOfWork.SaveChangesAsync();

    }

    public async Task RemoveFollowerAsync(Guid currentUserId, Guid followerUserId)
    {
        if (currentUserId == followerUserId)
            throw new BadRequestException("You cannot remove yourself as a follower.");

        // The follower is following ME — so followerUserId is the follower, currentUserId is the following
        var follow = await _unitOfWork.Follows.GetFollowAsync(followerUserId, currentUserId)
            ?? throw new NotFoundException("This user is not following you.");

        var followerName = follow.FollowerUser.FullName;
        var removedId = follow.FollowerUser.Id;

        _unitOfWork.Follows.Remove(follow);
        await _unitOfWork.SaveChangesAsync();

    }

}