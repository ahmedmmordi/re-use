using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Offers;

public record OfferResponse
{
    public Guid OfferId { get; init; }

    public Guid ProductId { get; init; }
    public string ProductName { get; init; }
    public string ProductImageUrl { get; init; }
    public decimal OfferedPrice { get; init; }
    public string? Message { get; init; }
    public PurchaseRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; init; }

    public string BuyerName { get; init; } = null!;
}