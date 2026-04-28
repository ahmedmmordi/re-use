using ReUse.Application.DTOs.Follows;
using ReUse.Application.Options.Filters;

namespace ReUse.Application.Interfaces.Services;

public interface IFollowService
{
    Task<PaginatedList<FollowDto>> GetFollowersAsync(Guid userId, UserQueryOptions query);
    Task<PaginatedList<FollowDto>> GetFollowingsAsync(Guid userId, UserQueryOptions filter);
    Task<FollowResultDto> FollowAsync(Guid currentUserId, Guid targetUserId);
    Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
    Task RemoveFollowerAsync(Guid currentUserId, Guid followerUserId);

}