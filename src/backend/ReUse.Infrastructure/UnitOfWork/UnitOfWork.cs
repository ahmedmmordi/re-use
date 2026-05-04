
using Microsoft.EntityFrameworkCore.Storage;

using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;

namespace ReUse.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        User = new UserRepository(_context);
        Follow = new FollowRepository(_context);
        Category = new CategoryRepository(_context);
        ProductImages = new ProductImageRepository(_context);
        Product = new ProductRepository(_context);
    }
    public IUserRepository User { get; private set; }

    public IFollowRepository Follow { get; private set; }
    public IProductImageRepository ProductImages { get; private set; }

    public IProductRepository Product { get; private set; }
    public ICategoryRepository Category { get; private set; }

    public async Task CommitTransactionAsync()
    {
        if (_transaction is null) return;

        await _transaction.CommitAsync();
        await _transaction.DisposeAsync();

        _transaction = null;
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }
    public async Task RollbackTransactionAsync()
    {
        if (_transaction is null) return;

        await _transaction.RollbackAsync();
        await _transaction.DisposeAsync();
        _transaction = null;
    }
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();

    }

    public void Dispose()
    {
        _context.Dispose();
    }

}