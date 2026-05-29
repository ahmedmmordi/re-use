namespace ReUse.Application.DTOs.Feedback;

public record FeedbackUserResponse
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? ProfileImageUrl { get; init; }
}