using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = default!;

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = default!;

    public MessageType MessageType { get; set; }

    public string? Content { get; set; }
    public string? MediaUrl { get; set; }

    public DateTime SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public bool IsDeletedBySender { get; set; }
    public bool IsDeletedByReceiver { get; set; }
}