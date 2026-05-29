namespace ReUse.Application.DTOs.Feedback;

public record FeedbackResponse
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductTitle { get; init; } = string.Empty;
    public int Stars { get; init; }
    public string Comment { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public FeedbackUserResponse Rater { get; init; } = default!;
    public FeedbackUserResponse Ratee { get; init; } = default!;
}