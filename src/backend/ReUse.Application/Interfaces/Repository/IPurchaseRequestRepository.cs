using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Offers;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository;

public interface IPurchaseRequestRepository : IBaseRepository<PurchaseRequest>
{
    Task<PurchaseRequest> GetByIdWithProductAndBuyerAsync(Guid id);
    Task<PagedResult<PurchaseRequest>> GetSentAsync(Guid buyerId, OffersFilterParams filterParams);
    Task<PagedResult<PurchaseRequest>> GetReceivedAsync(Guid sellerId, OffersFilterParams filterParams);
    Task<List<PurchaseRequest>> GetPendingByProductAsync(Guid productId);
}