using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface ICategoryRepository
{

    Task<List<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(Guid id);

    Task<bool> ExistsAsync(Guid id);
    Task AddAsync(Category category);
    void Update(Category category);
    void Delete(Category category);

}