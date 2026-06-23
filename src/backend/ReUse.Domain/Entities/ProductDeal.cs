using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class ProductDeal : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = default!;

    public Guid ProposerId { get; set; }
    public User Proposer { get; set; } = default!;

    public Guid ReceiverId { get; set; }
    public User Receiver { get; set; } = default!;

    public DealType DealType { get; set; }
    public DealStatus Status { get; set; } = DealStatus.Pending;

    public decimal? AgreedPrice { get; set; }

    public string? Notes { get; set; }

    public DateTime? CompletedAt { get; set; }
}