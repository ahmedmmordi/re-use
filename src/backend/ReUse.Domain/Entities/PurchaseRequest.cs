using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class PurchaseRequest : BaseEntity
{
    // Product
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    // Buyer
    public Guid BuyerUserId { get; set; }
    public User Buyer { get; set; } = default!;

    // Offered price
    public decimal OfferedPrice { get; set; }

    // Optional message
    public string? Message { get; set; }

    // Status
    public PurchaseRequestStatus Status { get; set; }

    // Response info
    public DateTime? RespondedAt { get; set; }
}