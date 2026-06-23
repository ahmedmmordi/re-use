using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Users.Admin;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Repository;

public interface IProductDealRepository : IBaseRepository<ProductDeal>
{
    Task<ProductDeal?> GetActiveByConversationIdAsync(Guid conversationId);

    Task<List<ProductDeal>> GetByProductIdAsync(Guid productId, List<DealStatus>? statuses = null);

    Task<List<ProductDeal>> GetByProductIdForUserAsync(Guid userId, Guid productId,
        List<DealStatus>? statuses = null);
}