using System.Text.Json;

namespace ReUse.Application.Interfaces.Services;

public interface IPromotionService
{
    Task<string> CreateProductPremiumPayment(Guid productId, Guid userId, int durationDays);
    decimal CalculatePremiumAmount(int durationDays);
    Task PayCallback(string receivedHmac, object data);
}