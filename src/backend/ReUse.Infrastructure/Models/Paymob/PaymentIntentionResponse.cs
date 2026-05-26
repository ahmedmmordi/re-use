using ReUse.Application.DTOs.Payment;

namespace ReUse.Infrastructure.Models.Paymob;

public class PaymentIntentionResponse
{
    public List<PaymentKey> PaymentKeys { get; set; }

    public long IntentionOrderId { get; set; }

    public string Id { get; set; }

    public IntentionDetail IntentionDetail { get; set; }

    public string ClientSecret { get; set; }

    public List<PaymentMethod> PaymentMethods { get; set; }

    public string SpecialReference { get; set; }

    public object Extras { get; set; }

    public object CreationExtras { get; set; }

    public string ConfirmationExtras { get; set; }

    public bool Confirmed { get; set; }

    public string Status { get; set; }

    public DateTime Created { get; set; }

    public string CardDetail { get; set; }

    public List<string> CardTokens { get; set; }
}

public class PaymentKey
{
    public int Integration { get; set; }

    public string Key { get; set; }

    public string GatewayType { get; set; }

    public string IframeId { get; set; }

    public long OrderId { get; set; }
}

public class IntentionDetail
{
    public decimal Amount { get; set; }

    public List<ItemDto> Items { get; set; }

    public string Currency { get; set; }

    public BillingDataDto BillingData { get; set; }
}

public class PaymentMethod
{
    public int IntegrationId { get; set; }

    public string Alias { get; set; }

    public string Name { get; set; }

    public string MethodType { get; set; }

    public string Currency { get; set; }

    public bool Live { get; set; }

    public bool UseCvcWithMoto { get; set; }
}