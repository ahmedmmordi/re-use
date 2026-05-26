
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
        CategoryFollow = new CategoryFollowRepository(_context);
        Product = new ProductRepository(_context);
        Notifications = new NotificationRepository(_context);
        Favorites = new FavoriteRepository(_context);
        Comments = new CommentRepository(_context);
        Payments = new PaymentRepository(_context);
    }
    public IUserRepository User { get; private set; }

    public IFollowRepository Follow { get; private set; }
    public IProductImageRepository ProductImages { get; private set; }

    public IProductRepository Product { get; private set; }
    public ICategoryRepository Category { get; private set; }

    public ICategoryFollowRepository CategoryFollow { get; private set; }

    public INotificationRepository Notifications { get; private set; }

    public IFavoriteRepository Favorites { get; private set; }
    public ICommentRepository Comments { get; private set; }

    public IPaymentRepository Payments { get; private set; }

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