
using ReUse.Application.Interfaces.Repository;

namespace ReUse.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    IUserRepository User { get; }
    IFollowRepository Follow { get; }
    IProductImageRepository ProductImages { get; }
    ICategoryRepository Category { get; }
    IProductRepository Product { get; }
    Task<int> SaveChangesAsync();
    void Dispose();
}