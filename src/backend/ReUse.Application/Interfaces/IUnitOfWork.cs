
using ReUse.Application.Interfaces.Repository;

namespace ReUse.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository User { get; }
    Task<int> SaveChangesAsync();
    void Dispose();
}