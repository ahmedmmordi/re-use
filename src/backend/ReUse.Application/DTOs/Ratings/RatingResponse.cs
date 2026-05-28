namespace ReUse.Application.DTOs.Ratings;

public record RatingResponse
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductTitle { get; init; } = string.Empty;
    public int Stars { get; init; }
    public DateTime CreatedAt { get; init; }
    public RatingUserResponse Rater { get; init; } = default!;
    public RatingUserResponse Ratee { get; init; } = default!;
}