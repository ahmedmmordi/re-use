namespace ReUse.Application.DTOs.Products.Requests;

public record PremiumRequest
{
    public int DurationDays { get; init; }
}