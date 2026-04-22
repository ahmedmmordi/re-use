
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


}