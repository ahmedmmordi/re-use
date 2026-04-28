using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Users;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class FollowRepository : BaseRepository<Follow>, IFollowRepository
{
    private readonly ApplicationDbContext _context;
    public FollowRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }
    public async Task<PagedResult<User>> GetFollowersAsync(Guid userId, UserFilterParams filterParams, CancellationToken cancellationToken = default)
    {
        return await _context.Follows
            .AsNoTracking()
            .Where(f => f.FollowingId == userId)
            .Select(f => f.FollowerUser)
            .Search(filterParams.SearchTerm)
            .FilterByCity(filterParams.City)
            .FilterByCountry(filterParams.Country)
            .FilterByStateProvince(filterParams.StateProvince)
            .ApplySort(filterParams.SortBy, filterParams.SortOrder)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize, cancellationToken);
    }
    public async Task<PagedResult<User>> GetFollowingsAsync(Guid userId, UserFilterParams filterParams, CancellationToken cancellationToken = default)
    {
        return await _context.Follows
            .AsNoTracking()
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingUser)
            .Search(filterParams.SearchTerm)
            .FilterByCity(filterParams.City)
            .FilterByCountry(filterParams.Country)
            .FilterByStateProvince(filterParams.StateProvince)
            .ApplySort(filterParams.SortBy, filterParams.SortOrder)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize, cancellationToken);
    }
    public async Task<bool> IsAlreadyFollowingAsync(Guid followerId, Guid followingId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
    }

    public async Task<Follow?> GetFollowAsync(Guid followerId, Guid followingId)
    {
        return await _context.Follows
        .Include(f => f.FollowerUser)
        .Include(f => f.FollowingUser)
        .FirstOrDefaultAsync(f =>
            f.FollowerId == followerId &&
            f.FollowingId == followingId);
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        await _context.Follows
            .Where(f => f.FollowerId == userId || f.FollowingId == userId)
            .ExecuteDeleteAsync();
    }


}