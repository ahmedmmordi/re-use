using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Follows;
using ReUse.Application.DTOs.Users;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;


namespace ReUse.Application.Services;

public class FollowService : IFollowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public FollowService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<PagedResult<FollowDto>> GetFollowersAsync(Guid userId, UserFilterParams filterParams)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followers = await _unitOfWork.Follow.GetFollowersAsync(userId, filterParams);


        var dtoList = _mapper.Map<List<FollowDto>>(followers.Data);


        return new PagedResult<FollowDto>
        {
            Data = dtoList,
            PageNumber = followers.PageNumber,
            PageSize = followers.PageSize,
            TotalRecords = followers.TotalRecords
        };
    }

    public async Task<PagedResult<FollowDto>> GetFollowingsAsync(Guid userId, UserFilterParams filterParams)
    {
        if (userId == Guid.Empty)
            throw new BadRequestException("UserId cannot be empty");

        var followings = await _unitOfWork.Follow.GetFollowingsAsync(userId, filterParams);

        var dtoList = _mapper.Map<List<FollowDto>>(followings.Data);

        return new PagedResult<FollowDto>
        {
            Data = dtoList,
            PageNumber = followings.PageNumber,
            PageSize = followings.PageSize,
            TotalRecords = followings.TotalRecords
        };
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

        // The follower is following ME — so followerUserId is the follower, currentUserId is the following
        var follow = await _unitOfWork.Follow.GetFollowAsync(followerUserId, currentUserId)
            ?? throw new NotFoundException("This user is not following you.");

        var followerName = follow.FollowerUser.FullName;
        var removedId = follow.FollowerUser.Id;

        _unitOfWork.Follow.Remove(follow);
        await _unitOfWork.SaveChangesAsync();

    }

}