namespace ReUse.Application.DTOs.Ratings;

public record UserRatingSummaryResponse
{
    public decimal Average { get; init; }
    public int Count { get; init; }
}