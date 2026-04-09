
using ReUse.Application.Interfaces.Repository;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    public UserRepository(ApplicationDbContext context)
    {
    }
}