using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Users;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

/*
 * TODO create new FilterParams
 * follow repo use `UserFilterParams` and may not want all params in it ...
 */
public interface IFollowRepository : IBaseRepository<Follow>
{
    Task<PagedResult<User>> GetFollowersAsync(Guid userId, UserFilterParams filterParams, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetFollowingsAsync(Guid userId, UserFilterParams filterParams, CancellationToken cancellationToken = default);
    Task<bool> IsAlreadyFollowingAsync(Guid followerId, Guid followingId);
    Task<Follow?> GetFollowAsync(Guid followerId, Guid followingId);
    Task DeleteByUserIdAsync(Guid userId);
}