using System.Text.Json;

using ReUse.Application.DTOs.Payment;

namespace ReUse.Application.Interfaces.Services.External;

public interface IPaymentService
{
    Task<string> Pay(List<ItemDto> items, BillingDataDto billingData, Guid userId);
    Task Callback(string receivedHmac, JsonElement data);
}