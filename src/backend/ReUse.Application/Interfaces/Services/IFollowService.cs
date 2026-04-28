using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Follows;
using ReUse.Application.DTOs.Users;

namespace ReUse.Application.Interfaces.Services;

public interface IFollowService
{
    Task<PagedResult<FollowDto>> GetFollowersAsync(Guid userId, UserFilterParams filterParams);
    Task<PagedResult<FollowDto>> GetFollowingsAsync(Guid userId, UserFilterParams filterParams);
    Task<FollowResultDto> FollowAsync(Guid currentUserId, Guid targetUserId);
    Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
    Task RemoveFollowerAsync(Guid currentUserId, Guid followerUserId);

}