using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IUserRepository
{
    void Add(User entity);

    void Update(User entity);

    void Remove(User entity);
}