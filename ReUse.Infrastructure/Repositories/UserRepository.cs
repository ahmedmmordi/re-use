
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;
    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public void Add(User entity)
    {
        _context.Set<User>().Add(entity);
    }

    public void Update(User entity)
    {
        _context.Set<User>().Update(entity);
    }

    public void Remove(User entity)
    {
        _context.Set<User>().Remove(entity);
    }
}