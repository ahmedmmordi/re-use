using System.Text.Json.Serialization;

using ReUse.Application.DTOs.Payment;

namespace ReUse.Infrastructure.Models.Paymob;

public class PaymentIntentionRequest
{
    public decimal Amount { get; set; }

    public string Currency { get; set; }

    public List<int> PaymentMethods { get; set; }

    public List<ItemDto>? Items { get; set; }

    public BillingDataDto BillingData { get; set; }

    public object? Extras { get; set; }

    public string? SpecialReference { get; set; }

    public int? Expiration { get; set; }

    public string? NotificationUrl { get; set; }

    public string? RedirectionUrl { get; set; }
}