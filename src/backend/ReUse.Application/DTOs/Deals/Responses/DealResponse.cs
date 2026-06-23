using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Deals.Responses;

public class DealResponse
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid ProductId { get; set; }

    public DealParticipantDto Proposer { get; set; } = default!;
    public DealParticipantDto Receiver { get; set; } = default!;

    public decimal? AgreedPrice { get; set; }
    public DealType DealType { get; set; }
    public DealStatus Status { get; set; }

    public string? Notes { get; set; }

    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}