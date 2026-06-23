namespace ReUse.Application.DTOs.Deals.Responses;

public class ProductDealsResponse
{
    public Guid ProductId { get; set; }
    public List<DealResponse> Deals { get; set; } = [];
}