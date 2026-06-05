using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Offers;

namespace ReUse.Application.Interfaces.Services;

public interface IOfferService
{
    Task<PagedResult<OfferResponse>> GetSentOffers(OffersFilterParams filterParams, Guid buyerId);
    Task SendOffer(SendOfferRequest request, Guid buyerId);
    Task CancelOffer(Guid offerId, Guid buyerId);

    Task<PagedResult<OfferResponse>> GetReceivedOffers(OffersFilterParams filterParams, Guid sellerId);
    Task AcceptOffer(Guid offerId, Guid sellerId);
    Task RejectOffer(Guid offerId, Guid sellerId);
}