using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class UpdateWantedProductValidator : AbstractValidator<UpdateWantedProductRequest>
{
    public UpdateWantedProductValidator()
    {
        When(x => x.BasicInfo is not null, () =>
            RuleFor(x => x.BasicInfo!)
                .SetValidator(new BasicInfoUpdateValidator()));

        When(x => x.DesiredPriceMin.HasValue, () =>
            RuleFor(x => x.DesiredPriceMin!.Value)
                .GreaterThan(0).WithMessage("Minimum price must be greater than 0"));

        When(x => x.DesiredPriceMax.HasValue, () =>
            RuleFor(x => x.DesiredPriceMax!.Value)
                .GreaterThan(0).WithMessage("Maximum price must be greater than 0"));

        When(x => x.DesiredPriceMin.HasValue && x.DesiredPriceMax.HasValue, () =>
            RuleFor(x => x)
                .Must(x => x.DesiredPriceMax >= x.DesiredPriceMin)
                .WithMessage("Maximum price must be >= minimum price"));
    }
}