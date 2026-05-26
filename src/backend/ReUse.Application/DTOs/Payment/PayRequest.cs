namespace ReUse.Application.DTOs.Payment;

public record PayRequest
{
    public List<ItemDto> Items { get; init; } = null!;
    public BillingDataDto BillingData { get; init; } = null!;

}