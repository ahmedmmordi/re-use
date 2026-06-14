using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class ProductDeal : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = default!;

    public Guid SellerId { get; set; }
    public User Seller { get; set; } = default!;

    public Guid BuyerId { get; set; }
    public User Buyer { get; set; } = default!;

    public DealType DealType { get; set; }

    public decimal? AgreedPrice { get; set; }

    public string? Notes { get; set; }

    public DateTime? CompletedAt { get; set; }

    public bool SellerConfirmed { get; set; }

    public bool BuyerConfirmed { get; set; }
}