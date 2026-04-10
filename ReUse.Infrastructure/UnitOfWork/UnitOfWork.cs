
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;

namespace ReUse.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        User = new UserRepository(_context);
    }
    public IUserRepository User { get; private set; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

}