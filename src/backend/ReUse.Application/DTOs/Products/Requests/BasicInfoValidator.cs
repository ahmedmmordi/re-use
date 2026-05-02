using FluentValidation;

using ReUse.Application.DTOs.Products.Requests;

namespace ReUse.Application.DTOs.Products.Requests;

public class BasicInfoValidator : AbstractValidator<BasicInfoRequest>
{
    public BasicInfoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("CategoryId is required");

        RuleFor(x => x.Condition)
            .IsInEnum().WithMessage("Invalid product condition");
    }
}