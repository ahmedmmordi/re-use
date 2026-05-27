using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class ChangeProductStatusRequestValidator : AbstractValidator<ChangeProductStatusRequest>
{
    public ChangeProductStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid product status.");
    }
}