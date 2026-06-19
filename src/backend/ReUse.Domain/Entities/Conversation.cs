using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class Conversation : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public Guid ReactantId { get; set; }
    public User Reactant { get; set; } = default!;

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = default!;

    public ConversationStatus Status { get; set; } = ConversationStatus.Active;

    public bool IsActive { get; set; } = true;

    public DateTime LastActivityAt { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}