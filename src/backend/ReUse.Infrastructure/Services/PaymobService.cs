using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Configuration;

using ReUse.Application.DTOs.Payment;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Models.Paymob;

namespace ReUse.Infrastructure.Services;

public class PaymobService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _http;
    private readonly IUnitOfWork _uow;
    private readonly string _publicKey;
    private readonly string _secretKey;
    private readonly string _hmac;
    private readonly string _cardIntegrationId;
    private readonly string _callbackUrl;

    public PaymobService(HttpClient http, IUnitOfWork uow, IConfiguration configuration)
    {
        _configuration = configuration;
        _uow = uow;
        _http = http;
        _publicKey = _configuration["Paymob:PublicKey"] ??
                    throw new ArgumentException("Paymob public key not configured");
        _secretKey = _configuration["Paymob:SecretKey"] ??
                     throw new ArgumentException("Paymob secret key not configured");
        _hmac = _configuration["Paymob:HMAC"] ??
                throw new ArgumentException("Paymob HMAC not configured");
        _cardIntegrationId = _configuration["Paymob:CardIntegrationId"] ??
                             throw new ArgumentException("Paymob Card Integration ID not configured");
        _callbackUrl = _configuration["Paymob:CallbackUrl"] ??
                       throw new ArgumentException("Paymob Callback Url not configured");
    }

    public async Task<string> Pay(List<ItemDto> items, BillingDataDto billingData, Guid userId)
    {
        var paymentIntentionResponse = await Intention(items, billingData);

        var payment = new Payment
        {
            Amount = paymentIntentionResponse.IntentionDetail.Amount,
            PaymentMethod = paymentIntentionResponse.PaymentMethods.FirstOrDefault()!.Name,
            Status = PaymentStatus.Pending,
            TransactionId = paymentIntentionResponse.SpecialReference,
            PaymentDate = DateTime.Now,
            UserId = userId,
        };

        _uow.Payments.Add(payment);
        await _uow.SaveChangesAsync();

        string payUrl = $"https://accept.paymob.com/unifiedcheckout/?publicKey={_publicKey}&clientSecret={paymentIntentionResponse.ClientSecret}";

        return payUrl;
    }

    public async Task Callback(string receivedHmac, JsonElement data)
    {
        if (!data.TryGetProperty("obj", out var obj))
            throw new BadRequestException("Missing 'obj' in payload.");

        if (!ValidateHmac(receivedHmac, obj))
        {
            throw new UnauthorizedException();
        }

        string merchantOrderId = null;
        if (obj.TryGetProperty("order", out var order) &&
            order.TryGetProperty("merchant_order_id", out var merchantOrderIdElement) &&
            merchantOrderIdElement.ValueKind != JsonValueKind.Null)
        {
            merchantOrderId = merchantOrderIdElement.ToString();
        }

        bool isSuccess = obj.TryGetProperty("success", out var successElement) && successElement.GetBoolean();

        if (!string.IsNullOrEmpty(merchantOrderId))
        {
            if (isSuccess)
                await Success(merchantOrderId);
            else
                await Failed(merchantOrderId);
        }
        else
        {
            throw new BadRequestException("Missing 'merchant_order_id' in payload.");
        }
    }

    private bool ValidateHmac(string receivedHmac, JsonElement data)
    {
        string[] fields =
        [
            "amount_cents",
            "created_at",
            "currency",
            "error_occured",
            "has_parent_transaction",
            "id",
            "integration_id",
            "is_3d_secure",
            "is_auth",
            "is_capture",
            "is_refunded",
            "is_standalone_payment",
            "is_voided",
            "order.id",
            "owner",
            "pending",
            "source_data.pan",
            "source_data.sub_type",
            "source_data.type",
            "success"
        ];

        var concatenated = new StringBuilder();
        foreach (var field in fields)
        {
            string[] parts = field.Split('.');
            JsonElement current = data;
            bool found = true;
            foreach (var part in parts)
            {
                if (current.ValueKind == JsonValueKind.Object && current.TryGetProperty(part, out var next))
                    current = next;
                else
                {
                    found = false;
                    break;
                }
            }

            if (!found || current.ValueKind == JsonValueKind.Null)
            {
                concatenated.Append(""); // Use empty string for missing/null fields
            }
            else if (current.ValueKind == JsonValueKind.True || current.ValueKind == JsonValueKind.False)
            {
                concatenated.Append(current.GetBoolean() ? "true" : "false"); // Lowercase boolean
            }
            else
            {
                concatenated.Append(current.ToString());
            }
        }

        var computedHmac = ComputeHmacSHA512(concatenated.ToString(), _hmac);

        return receivedHmac.Equals(computedHmac, StringComparison.OrdinalIgnoreCase);
    }

    private string ComputeHmacSHA512(string data, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using (var hmac = new HMACSHA512(keyBytes))
        {
            var hash = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }

    private async Task Success(string transactionId)
    {
        var payment = await _uow.Payments.GetByTransactionId(transactionId);
        if (payment == null)
        {
            throw new NotFoundException($"Payment with transaction ID {transactionId} not found.");
        }

        payment.Status = PaymentStatus.Success;
        await _uow.SaveChangesAsync();
    }

    private async Task Failed(string transactionId)
    {
        var payment = await _uow.Payments.GetByTransactionId(transactionId);
        if (payment == null)
        {
            throw new NotFoundException($"Payment with transaction ID {transactionId} not found.");
        }

        payment.Status = PaymentStatus.Fail;
        await _uow.SaveChangesAsync();
    }

    private async Task<PaymentIntentionResponse> Intention(List<ItemDto> items, BillingDataDto billingData, object? extras = null)
    {
        decimal amount = 0;
        foreach (var item in items)
        {
            amount += item.Quantity * item.Amount;
        }

        var payload = new PaymentIntentionRequest
        {
            Amount = amount, // Required // the sum of all amount * quantity of items should be equal 5 * 100 + 5 * 100
            Currency = "EGP", // Required
            PaymentMethods = new List<int> { Convert.ToInt32(_cardIntegrationId) }, // Required
            Items = items, // the total amount of this all items be 5 * 100 + 5 * 100
            BillingData = billingData, // Required
            Extras = extras ?? new { },
            SpecialReference = Guid.NewGuid().ToString(), // Required, must be unique for each transaction, can be used to track the transaction in your system. You can use the same value for multiple transactions if you want to track them as one order. This value is returned in the transaction callback under special_reference.
            Expiration = 3600, // 1 hour expiration
            NotificationUrl = _callbackUrl // Paymob sends an HTTP POST request to this URL whether the payment is Successful or Failed You use it to update your database automatically.
            // RedirectionUrl = ""
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://accept.paymob.com/v1/intention/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Token", _secretKey);
        Console.WriteLine(_secretKey);
        request.Content = JsonContent.Create(payload,
            options: new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

        var response = await _http.SendAsync(request);

        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Paymob Intention API call failed with status {response.StatusCode}: {body}");
        }


        var paymentIntentionResponse = JsonSerializer.Deserialize<PaymentIntentionResponse>(body,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            }) ?? throw new Exception(
            "Failed to deserialize Paymob response");
        Console.WriteLine(paymentIntentionResponse.PaymentMethods.Count);
        return paymentIntentionResponse;
    }

}