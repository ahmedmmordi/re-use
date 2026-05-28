using System.Text.Json;

namespace ReUse.Application.DTOs.Payment;

// ReUse.Application.DTOs.Payment/PaymentCallbackDto.cs
public class PaymentCallbackDto
{
    public bool IsSuccess { get; set; }
    public string TransactionId { get; set; }

    public bool AlreadyProcessed { get; set; }

    // store raw extra internally
    private readonly object? _extra;

    public PaymentCallbackDto(bool isSuccess, string transactionId, bool alreadyProcessed = false, object? extra = null)
    {
        IsSuccess = isSuccess;
        TransactionId = transactionId;
        _extra = extra;
        AlreadyProcessed = alreadyProcessed;
    }

    public T? GetExtra<T>() where T : class
    {
        if (_extra is JsonElement element)
            return element.Deserialize<T>(new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
        return null;
    }
}