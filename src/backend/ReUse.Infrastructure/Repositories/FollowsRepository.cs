using Microsoft.EntityFrameworkCore;

using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Options.Filters;
using ReUse.Application.Options.Filters.Extensions;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class FollowsRepository : BaseRepository<Follow>, IFollowsRepository
{
    private readonly ApplicationDbContext _db;
    public FollowsRepository(ApplicationDbContext db) : base(db)
    {
        _db = db;
    }
    public async Task<PaginatedList<User>> GetFollowersAsync(Guid userId, UserQueryOptions query)
    {
        var queryable = _db.Follows
    .AsNoTracking()
    .Where(f => f.FollowingId == userId)
    .Select(f => f.FollowerUser)
    .ApplyQuery(
        query.Filter,
        query.Search?.Keyword,
        query.Search?.SearchBy,
        query.SortBy,
        query.SortDirection
    );
        return await PaginatedList<User>.CreateAsync(
        queryable,
        query.PageNumber,
        query.PageSize);
    }
    public async Task<PaginatedList<User>> GetFollowingsAsync(Guid userId, UserQueryOptions query)
    {
        var queryable = _db.Follows
    .AsNoTracking()
    .Where(f => f.FollowerId == userId)
    .Select(f => f.FollowingUser)
    .ApplyQuery(
        query.Filter,
        query.Search?.Keyword,
        query.Search?.SearchBy,
        query.SortBy,
        query.SortDirection
    );
        return await PaginatedList<User>.CreateAsync(
       queryable,
       query.PageNumber,
       query.PageSize);
    }
    public async Task<bool> IsAlreadyFollowingAsync(Guid followerId, Guid followingId)
    {
        return await _db.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
    }

    public async Task<Follow?> GetFollowAsync(Guid followerId, Guid followingId)
    {
        return await _db.Follows
        .Include(f => f.FollowerUser)
        .Include(f => f.FollowingUser)
        .FirstOrDefaultAsync(f =>
            f.FollowerId == followerId &&
            f.FollowingId == followingId);
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        await _db.Follows
            .Where(f => f.FollowerId == userId || f.FollowingId == userId)
            .ExecuteDeleteAsync();
    }


}