using FluentValidation;

using ReUse.Application.DTOs.Products.Requests;
using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Requests;

public class CloseProductRequestValidator : AbstractValidator<CloseProductRequest>
{
    public CloseProductRequestValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty()
            .WithMessage("ConversationId is required.");

        RuleFor(x => x.ClosureType)
            .IsInEnum()
            .WithMessage("Invalid closure type.");

        RuleFor(x => x.FinalPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.FinalPrice.HasValue)
            .WithMessage("Final price must be greater than or equal to zero.");

        RuleFor(x => x.FinalPrice)
            .NotNull()
            .GreaterThan(0)
            .When(x => x.ClosureType == ProductClosureType.Sold)
            .WithMessage("Final price is required when the product is sold.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .WithMessage("Notes cannot exceed 1000 characters.");
    }
}