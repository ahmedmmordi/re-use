
using ReUse.Application.Interfaces.Repository;

namespace ReUse.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository User { get; }
    IFollowsRepository Follows { get; }
    IProductImageRepository ProductImages { get; }

    Task<int> SaveChangesAsync();
    void Dispose();
}