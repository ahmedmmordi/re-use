using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Offers;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class OfferService : IOfferService
{
    private readonly IUnitOfWork _unitOfWork;

    public OfferService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<OfferResponse>> GetSentOffers(OffersFilterParams filterParams, Guid buyerId)
    {
        var offers = await _unitOfWork.PurchaseRequests
            .GetSentAsync(buyerId, filterParams);

        return new PagedResult<OfferResponse>
        {
            Data = offers.Data.Select(x => new OfferResponse
            {
                OfferId = x.Id,
                ProductId = x.ProductId,
                ProductName = x.Product.Title,
                ProductImageUrl = x.Product.ProductImages
                    .FirstOrDefault()?.Url ?? string.Empty,
                OfferedPrice = x.OfferedPrice,
                Message = x.Message,
                Status = x.Status,
                BuyerName = x.Buyer.FullName,
                CreatedAt = x.CreatedAt
            }).ToList(),

            TotalRecords = offers.TotalRecords,
            PageNumber = offers.PageNumber,
            PageSize = offers.PageSize
        };
    }

    public async Task SendOffer(SendOfferRequest request, Guid buyerId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(request.ProductId);

        if (product is null)
            throw new NotFoundException("Product not found");

        if (product.OwnerUserId == buyerId)
            throw new BadRequestException("You cannot buy your own product");

        if (product.Status != ProductStatus.Active)
            throw new BadRequestException("Product is not available");

        var offer = new PurchaseRequest
        {
            ProductId = request.ProductId,
            BuyerUserId = buyerId,
            OfferedPrice = request.OfferedPrice,
            Message = request.Message,
            Status = PurchaseRequestStatus.Pending
        };

        _unitOfWork.PurchaseRequests.Add(offer);

        await _unitOfWork.SaveChangesAsync();

        // TODO send notification 
    }

    public async Task CancelOffer(Guid offerId, Guid buyerId)
    {
        var offer = await _unitOfWork.PurchaseRequests.GetByIdWithProductAndBuyerAsync(offerId);

        if (offer is null)
            throw new NotFoundException("Offer not found");

        if (offer.BuyerUserId != buyerId)
            throw new ForbiddenException();

        if (offer.Status != PurchaseRequestStatus.Pending)
            throw new BadRequestException("Offer already processed");

        offer.Status = PurchaseRequestStatus.Cancelled;

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PagedResult<OfferResponse>> GetReceivedOffers(OffersFilterParams filterParams, Guid sellerId)
    {
        var offers = await _unitOfWork.PurchaseRequests
            .GetReceivedAsync(sellerId, filterParams);

        return new PagedResult<OfferResponse>
        {
            Data = offers.Data.Select(x => new OfferResponse
            {
                OfferId = x.Id,
                ProductId = x.ProductId,
                ProductName = x.Product.Title,
                ProductImageUrl = x.Product.ProductImages
                    .FirstOrDefault()?.Url ?? string.Empty,
                OfferedPrice = x.OfferedPrice,
                Message = x.Message,
                Status = x.Status,
                BuyerName = x.Buyer.FullName,
                CreatedAt = x.CreatedAt
            }).ToList(),

            TotalRecords = offers.TotalRecords,
            PageNumber = offers.PageNumber,
            PageSize = offers.PageSize
        };
    }

    public async Task AcceptOffer(Guid offerId, Guid sellerId)
    {
        var offer = await _unitOfWork.PurchaseRequests.GetByIdWithProductAndBuyerAsync(offerId);

        if (offer is null)
            throw new NotFoundException("Offer not found");

        if (offer.Product.OwnerUserId != sellerId)
            throw new ForbiddenException();

        if (offer.Status != PurchaseRequestStatus.Pending)
            throw new BadRequestException("Offer already processed");

        if (offer.Product.Status == ProductStatus.Sold)
            throw new BadRequestException("Already sold");

        offer.Status = PurchaseRequestStatus.Accepted;
        offer.RespondedAt = DateTime.UtcNow;

        offer.Product.Status = ProductStatus.Sold;

        var sale = new ProductSale
        {
            ProductId = offer.ProductId,
            BuyerUserId = offer.BuyerUserId,
            FinalPrice = offer.OfferedPrice,
            SoldAt = DateTime.UtcNow
        };

        _unitOfWork.ProductSales.Add(sale);

        var otherOffers =
            await _unitOfWork.PurchaseRequests.GetPendingByProductAsync(offer.ProductId);

        foreach (var other in otherOffers)
        {
            if (other.Id == offer.Id)
                continue;

            other.Status = PurchaseRequestStatus.Rejected;
            other.RespondedAt = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RejectOffer(Guid offerId, Guid sellerId)
    {
        var offer = await _unitOfWork.PurchaseRequests.GetByIdWithProductAndBuyerAsync(offerId);

        if (offer is null)
            throw new NotFoundException("Offer not found");

        if (offer.Product.OwnerUserId != sellerId)
            throw new ForbiddenException();

        if (offer.Status != PurchaseRequestStatus.Pending)
            throw new BadRequestException("Offer already processed");

        offer.Status = PurchaseRequestStatus.Rejected;
        offer.RespondedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();
    }
}