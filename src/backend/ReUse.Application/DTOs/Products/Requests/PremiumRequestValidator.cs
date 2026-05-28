using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class PremiumRequestValidator : AbstractValidator<PremiumRequest>
{
    private static readonly int[] Allowed =
        [7, 30, 90, 180, 365];

    public PremiumRequestValidator()
    {
        RuleFor(x => x.DurationDays)
            .InclusiveBetween(1, 365)
            .Must(days => Allowed.Contains(days))
            .WithMessage(
                "Allowed durations: 7, 30, 90, 180, 365 days.");
    }
}