namespace ReUse.Application.DTOs.Deals.Requests;

public class CreateDealRequest
{
    public decimal? AgreedPrice { get; set; }

    public string? Notes { get; set; }
}