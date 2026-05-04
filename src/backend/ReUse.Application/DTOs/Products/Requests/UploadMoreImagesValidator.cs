using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class UploadMoreImagesValidator : AbstractValidator<UploadMoreImagesRequest>
{
    public UploadMoreImagesValidator()
    {
        RuleFor(x => x.Images)
            .NotNull().WithMessage("Images are required")
            .NotEmpty().WithMessage("At least one image is required")
            .Must(images => images.Count <= 10)
            .WithMessage("You can upload up to 10 images at once");

        When(x => x.Images is not null && x.Images.Any(), () =>
        {
            RuleForEach(x => x.Images)
                .ChildRules(img =>
                {
                    img.RuleFor(x => x.Length)
                        .GreaterThan(0)
                        .WithMessage("Image file cannot be empty");

                    img.RuleFor(x => x.Length)
                        .LessThanOrEqualTo(5 * 1024 * 1024)
                        .WithMessage("Each image must be less than 5MB");
                });
        });
    }
}