namespace ReUse.Application.DTOs.Offers;

public record SendOfferRequest
{
    public Guid ProductId { get; init; }
    public decimal OfferedPrice { get; init; }
    public string? Message { get; set; }
}