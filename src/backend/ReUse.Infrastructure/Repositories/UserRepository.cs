
using Microsoft.EntityFrameworkCore;

using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    private readonly ApplicationDbContext _context;
    public UserRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }
    public async Task<User?> GetByIdentityIdAsync(string identityUserId)
    {
        return await _context.Set<User>()
            .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);
    }

    public async Task<string?> GetIdentityUserIdAsync(Guid userId)
    {
        return await _context.Set<User>()
            .Where(u => u.Id == userId).Select(u => u.IdentityUserId).FirstOrDefaultAsync();
    }

    public async Task<User?> GetProfileByIdAsync(Guid userId)
    {
        return await _context.Set<User>()
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

}