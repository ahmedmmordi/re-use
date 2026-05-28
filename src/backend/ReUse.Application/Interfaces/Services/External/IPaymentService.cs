using System.Text.Json;

using ReUse.Application.DTOs.Payment;
using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.Interfaces.Services.External;

public interface IPaymentService
{
    Task<string> Pay(List<ItemDto> items, BillingDataDto billingData, Guid userId, object? extras = null);
    Task<PaymentCallbackDto> HandleCallback(string receivedHmac, object rowPayload);
}