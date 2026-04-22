using ReUse.Application.Options.Filters;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IFollowsRepository : IBaseRepository<Follow>
{
    Task<PaginatedList<User>> GetFollowersAsync(Guid userId, UserQueryOptions query);
    Task<PaginatedList<User>> GetFollowingsAsync(Guid userId, UserQueryOptions query);
    Task<bool> IsAlreadyFollowingAsync(Guid followerId, Guid followingId);
    Task<Follow?> GetFollowAsync(Guid followerId, Guid followingId);
    Task DeleteByUserIdAsync(Guid userId);
}