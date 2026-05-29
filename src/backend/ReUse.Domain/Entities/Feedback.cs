namespace ReUse.Domain.Entities;

public class Feedback : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    // The user giving the feedback
    public Guid RaterUserId { get; set; }
    public User Rater { get; set; } = default!;

    // The user receiving the feedback
    public Guid RateeUserId { get; set; }
    public User Ratee { get; set; } = default!;

    // 1..5, validated in DB and in application layer
    public int Stars { get; set; }

    // Review text left alongside the rating
    public string Comment { get; set; } = string.Empty;

    // Soft-delete: set by admin moderation, excluded from all read paths and aggregates
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}