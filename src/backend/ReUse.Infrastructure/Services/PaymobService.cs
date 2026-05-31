using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Configuration;

using ReUse.Application.DTOs.Payment;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
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

    // Resolved lazily so a missing Paymob configuration does not break the
    // construction of unrelated controllers that merely depend on this service.
    private string _publicKey => _configuration["Paymob:PublicKey"] ??
        throw new ArgumentException("Paymob public key not configured");
    private string _secretKey => _configuration["Paymob:SecretKey"] ??
        throw new ArgumentException("Paymob secret key not configured");
    private string _hmac => _configuration["Paymob:HMAC"] ??
        throw new ArgumentException("Paymob HMAC not configured");
    private string _cardIntegrationId => _configuration["Paymob:CardIntegrationId"] ??
        throw new ArgumentException("Paymob Card Integration ID not configured");
    private string _callbackUrl => _configuration["Paymob:CallbackUrl"] ??
        throw new ArgumentException("Paymob Callback Url not configured");

    public PaymobService(HttpClient http, IUnitOfWork uow, IConfiguration configuration)
    {
        _configuration = configuration;
        _uow = uow;
        _http = http;
    }

    public async Task<string> Pay(List<ItemDto> items, BillingDataDto billingData, Guid userId, object? extras = null)
    {
        var paymentIntentionResponse = await Intention(items, billingData, extras);

        var payment = new Payment
        {
            Amount = paymentIntentionResponse.IntentionDetail.Amount,
            PaymentMethod = paymentIntentionResponse.PaymentMethods?.FirstOrDefault()?.Name
                            ?? throw new Exception("Paymob intention returned no payment methods"),
            Status = PaymentStatus.Pending,
            TransactionId = paymentIntentionResponse.SpecialReference,
            PaymentDate = DateTime.UtcNow,
            UserId = userId,
        };

        _uow.Payments.Add(payment);
        await _uow.SaveChangesAsync();

        string payUrl = $"https://accept.paymob.com/unifiedcheckout/?publicKey={_publicKey}&clientSecret={paymentIntentionResponse.ClientSecret}";

        return payUrl;
    }

    public async Task<PaymentCallbackDto> HandleCallback(string receivedHmac, object rawPayload)
    {
        var request = rawPayload as PaymobCallbackRequest
                      ?? throw new BadRequestException("Invalid payload type.");

        var obj = request.Obj ?? throw new BadRequestException("Missing 'obj' in payload.");

        if (!ValidateHmac(receivedHmac, obj))
            throw new UnauthorizedException();

        var merchantOrderId = obj.Order?.MerchantOrderId;
        if (string.IsNullOrEmpty(merchantOrderId))
            throw new BadRequestException("Missing 'merchant_order_id' in payload.");

        if (!obj.Success)
        {
            await Failed(merchantOrderId);
            return new PaymentCallbackDto(false, merchantOrderId);
        }


        var alreadyProcessed = !(await Success(merchantOrderId));
        return new PaymentCallbackDto(true, merchantOrderId, alreadyProcessed, obj.PaymentKeyClaims?.Extra);
    }

    private bool ValidateHmac(string receivedHmac, PaymobCallbackObj obj)
    {
        var concatenated = new StringBuilder();

        concatenated.Append(obj.AmountCents);
        concatenated.Append(obj.CreatedAt);
        concatenated.Append(obj.Currency);
        concatenated.Append(obj.ErrorOccured.ToString().ToLower());
        concatenated.Append(obj.HasParentTransaction.ToString().ToLower());
        concatenated.Append(obj.Id);
        concatenated.Append(obj.IntegrationId);
        concatenated.Append(obj.Is3dSecure.ToString().ToLower());
        concatenated.Append(obj.IsAuth.ToString().ToLower());
        concatenated.Append(obj.IsCapture.ToString().ToLower());
        concatenated.Append(obj.IsRefunded.ToString().ToLower());
        concatenated.Append(obj.IsStandalonePayment.ToString().ToLower());
        concatenated.Append(obj.IsVoided.ToString().ToLower());
        concatenated.Append(obj.Order?.Id);
        concatenated.Append(obj.Owner);
        concatenated.Append(obj.Pending.ToString().ToLower());
        concatenated.Append(obj.SourceData?.Pan);
        concatenated.Append(obj.SourceData?.SubType);
        concatenated.Append(obj.SourceData?.Type);
        concatenated.Append(obj.Success.ToString().ToLower());

        var computedHmac = ComputeHmacSHA512(concatenated.ToString(), _hmac);

        try
        {
            var receivedBytes = Convert.FromHexString(receivedHmac);
            var computedBytes = Convert.FromHexString(computedHmac);

            return CryptographicOperations.FixedTimeEquals(
                receivedBytes,
                computedBytes);
        }
        catch (FormatException)
        {
            return false;
        }
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

    private async Task<bool> Success(string transactionId)
    {
        var payment = await _uow.Payments.GetByTransactionId(transactionId);
        if (payment == null)
        {
            throw new NotFoundException($"Payment with transaction ID {transactionId} not found.");
        }

        if (payment.Status == PaymentStatus.Success) return false;

        payment.Status = PaymentStatus.Success;
        await _uow.SaveChangesAsync();
        return true;
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

        return paymentIntentionResponse;
    }

}