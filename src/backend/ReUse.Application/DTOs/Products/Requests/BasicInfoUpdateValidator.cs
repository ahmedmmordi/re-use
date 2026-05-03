using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class BasicInfoUpdateValidator : AbstractValidator<BasicInfoUpdateRequest>
{
    public BasicInfoUpdateValidator()
    {
        When(x => x.Title is not null, () =>
            RuleFor(x => x.Title!)
                .NotEmpty().WithMessage("Title cannot be empty")
                .MaximumLength(100).WithMessage("Title must not exceed 100 characters"));

        When(x => x.Description is not null, () =>
            RuleFor(x => x.Description!)
                .NotEmpty().WithMessage("Description cannot be empty")
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters"));

        When(x => x.CategoryId.HasValue, () =>
            RuleFor(x => x.CategoryId!.Value)
                .NotEmpty().WithMessage("CategoryId cannot be empty"));

        When(x => x.Condition.HasValue, () =>
            RuleFor(x => x.Condition!.Value)
                .IsInEnum().WithMessage("Invalid product condition"));
    }
}