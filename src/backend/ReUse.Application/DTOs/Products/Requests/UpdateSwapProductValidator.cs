using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class UpdateSwapProductValidator : AbstractValidator<UpdateSwapProductRequest>
{
    public UpdateSwapProductValidator()
    {
        When(x => x.BasicInfo is not null, () =>
            RuleFor(x => x.BasicInfo!)
                .SetValidator(new BasicInfoUpdateValidator()));

        When(x => x.WantedItemTitle is not null, () =>
            RuleFor(x => x.WantedItemTitle!)
                .NotEmpty().WithMessage("Wanted item title cannot be empty")
                .MaximumLength(100));

        When(x => x.WantedItemDescription is not null, () =>
            RuleFor(x => x.WantedItemDescription!)
                .NotEmpty().WithMessage("Wanted item description cannot be empty")
                .MaximumLength(1000));
    }
}