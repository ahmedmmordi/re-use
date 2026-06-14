using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Users.Admin;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IProductDealRepository : IBaseRepository<ProductDeal>
{
    Task<List<ProductDeal>> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByConversationIdAsync(Guid conversationId);
}