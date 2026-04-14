using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Users.Follows.Contracts;
using ReUse.Application.Options.Filters;

namespace ReUse.Application.Interfaces.Services.Follows;

public interface IFollowsService
{
    Task<PaginatedList<FollowsDtos>> GetFollowersAsync(Guid userId, UserQueryOptions query);
    Task<PaginatedList<FollowsDtos>> GetFollowingsAsync(Guid userId, UserQueryOptions filter);
    Task<FollowResultDto> FollowAsync(Guid currentUserId, Guid targetUserId);
    Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
    Task RemoveFollowerAsync(Guid currentUserId, Guid followerUserId);

}