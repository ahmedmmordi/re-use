namespace ReUse.Application.DTOs.Feedback;

public record UserFeedbackSummaryResponse
{
    public decimal Average { get; init; }
    public int Count { get; init; }
}