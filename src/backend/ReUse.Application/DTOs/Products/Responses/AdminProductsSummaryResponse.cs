namespace ReUse.Application.DTOs.Products.Responses;

public record AdminProductsSummaryResponse
{
    public int TotalProducts { get; init; }
    public int ActiveCount { get; init; }
    public int SoldCount { get; init; }
    public int ClosedCount { get; init; }
    public int DeletedCount { get; init; }
    public int UnderReviewCount { get; init; }
}