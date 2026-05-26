using System.Text.Json.Serialization;

namespace ReUse.Infrastructure.Models.Paymob;

public class PaymobWebhookDto
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("obj")]
    public PaymobTransactionDto Obj { get; set; } = null!;
}

public class PaymobTransactionDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("amount_cents")]
    public decimal AmountCents { get; set; }

    [JsonPropertyName("order")]
    public PaymobOrderDto Order { get; set; } = null!;
}

public class PaymobOrderDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("merchant_order_id")]
    public string? MerchantOrderId { get; set; }

    [JsonPropertyName("payment_status")]
    public string PaymentStatus { get; set; } = "";
}