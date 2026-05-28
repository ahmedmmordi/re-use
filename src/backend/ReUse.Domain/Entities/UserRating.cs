namespace ReUse.Domain.Entities;

public class UserRating : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    // The user giving the rating
    public Guid RaterUserId { get; set; }
    public User Rater { get; set; } = default!;

    // The user being rated
    public Guid RateeUserId { get; set; }
    public User Ratee { get; set; } = default!;

    // 1..5, validated in DB and in application layer
    public int Stars { get; set; }
}