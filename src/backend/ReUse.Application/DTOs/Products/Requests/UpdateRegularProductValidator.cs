using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class UpdateRegularProductValidator : AbstractValidator<UpdateRegularProductRequest>
{
    public UpdateRegularProductValidator()
    {
        When(x => x.BasicInfo is not null, () =>
            RuleFor(x => x.BasicInfo!)
                .SetValidator(new BasicInfoUpdateValidator()));

        When(x => x.Price.HasValue, () =>
            RuleFor(x => x.Price!.Value)
                .GreaterThan(0).WithMessage("Price must be greater than 0")
                .LessThanOrEqualTo(1_000_000).WithMessage("Price is too high"));
    }
}