using System.Text.Json;

using ReUse.Application.DTOs.Payment;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class PromotionService : IPromotionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentService _paymentService;

    public PromotionService(IUnitOfWork unitOfWork, IPaymentService paymentService)
    {
        _unitOfWork = unitOfWork;
        _paymentService = paymentService;
    }

    public async Task<string> CreateProductPremiumPayment(Guid productId, Guid userId, int durationDays)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (product.OwnerUserId != userId)
            throw new ForbiddenException("You don't own this product");

        if (product.Status == ProductStatus.Deleted)
            throw new NotFoundException("Product");

        if (product.IsPremium)
            throw new ConflictException("the product is already premium");

        var user = await _unitOfWork.User.GetByIdAsync(userId)
                   ?? throw new NotFoundException("User");

        var amount = CalculatePremiumAmount(durationDays);

        var Item = new List<ItemDto>
        {
            new ItemDto
            {
                Name = $"Premium promotion",
                Description = $"Premium promotion for '{product.Title}' for {durationDays}",
                Amount = amount,
                Quantity = 1,
                Image = product.ProductImages?.FirstOrDefault()?.Url
            }
        };


        var billingData = new BillingDataDto
        {
            FirstName = user.FullName?.Split(' ').FirstOrDefault() ?? "N/A",
            LastName = user.FullName?.Split(' ').Skip(1).FirstOrDefault() ?? "N/A",
            Email = user.Email,
            PhoneNumber = user.PhoneNumber ?? "N/A",
            City = user.City ?? "N/A",
            Country = user.Country ?? "N/A",
            State = user.StateProvince ?? "N/A",
            PostalCode = user.PostalCode ?? "N/A"
        };

        var extras = new PremiumExtra
        {
            ProductId = productId,
            DurationDays = durationDays
        };
        return await _paymentService.Pay(Item, billingData, userId, extras);
    }

    public decimal CalculatePremiumAmount(int durationDays)
    {
        return durationDays switch
        {
            <= 0 => throw new BadRequestException(
                "Duration must be greater than 0"),

            <= 7 => 4900m,

            <= 30 => 14900m,

            <= 90 => 34900m,

            <= 180 => 59900m,

            <= 365 => 99900m,

            _ => throw new BadRequestException(
                "Maximum premium duration is 365 days")
        };
    }

    public async Task PayCallback(string receivedHmac, object rawPayload)
    {
        var callback = await _paymentService.HandleCallback(receivedHmac, rawPayload);

        if (!callback.IsSuccess || callback.AlreadyProcessed) return;

        var extra = callback.GetExtra<PremiumExtra>()
                    ?? throw new BadRequestException("Missing premium metadata");

        if (extra.ProductId is null || extra.DurationDays is null)
            throw new BadRequestException("Missing premium metadata");

        var product = await _unitOfWork.Product.GetByIdAsync(extra.ProductId.Value)
                     ?? throw new NotFoundException("Product");

        product.PremiumExpiresAt = DateTime.UtcNow.AddDays(extra.DurationDays.Value);
        product.IsPremium = true;

        await _unitOfWork.SaveChangesAsync();
    }
}