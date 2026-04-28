
using ReUse.Application.Interfaces.Repository;

namespace ReUse.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository User { get; }
    IFollowRepository Follow { get; }
    IProductImageRepository ProductImages { get; }

    Task<int> SaveChangesAsync();
    void Dispose();
}