using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Chat.Responses;

/// <summary>
/// Flat projection returned by repository queries.
/// Carries the precomputed LastMessagePreview so AutoMapper
/// never needs to touch the Messages nav collection.
/// </summary>
public class ConversationProjection
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductTitle { get; init; } = string.Empty;
    public string? ProductCoverImageUrl { get; init; }
    public ProductStatus ProductStatus { get; init; }
    public Guid ReactantId { get; init; }
    public string ReactantName { get; init; } = string.Empty;
    public string? ReactantAvatarUrl { get; init; }
    public Guid OwnerId { get; init; }
    public string OwnerName { get; init; } = string.Empty;
    public string? OwnerAvatarUrl { get; init; }
    public ConversationStatus Status { get; init; }
    public bool IsActive { get; init; }
    public DateTime LastActivityAt { get; init; }
    public DateTime CreatedAt { get; init; }

    // Computed in SQL — never from nav collection
    public string? LastMessagePreview { get; init; }
    public MessageType? LastMessageType { get; init; }

    // Set by service after DB call (requires async count query)
    public int UnreadCount { get; set; }
}