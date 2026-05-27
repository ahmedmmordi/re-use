namespace ReUse.Application.DTOs.Products.Responses;

public record AdminProductsSummary(
    int Total,
    int Active,
    int Sold,
    int Closed,
    int Deleted,
    int UnderReview);