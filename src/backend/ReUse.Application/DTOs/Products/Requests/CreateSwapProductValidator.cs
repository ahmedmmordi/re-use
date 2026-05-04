using FluentValidation;

using ReUse.Application.DTOs.Products.Requests;

namespace ReUse.Application.DTOs.Products.Requests;

public class CreateSwapProductValidator : AbstractValidator<CreateSwapProductRequest>
{
    public CreateSwapProductValidator()
    {
        RuleFor(x => x.BasicInfo)
            .NotNull().WithMessage("BasicInfo is required")
            .SetValidator(new BasicInfoValidator());

        RuleFor(x => x.WantedItemTitle)
            .NotEmpty().WithMessage("Wanted item title is required")
            .MaximumLength(100);

        RuleFor(x => x.WantedItemDescription)
            .NotEmpty().WithMessage("Wanted item description is required")
            .MaximumLength(1000);

        //OFFER IMAGES 
        RuleFor(x => x.OfferImages)
            .NotNull().WithMessage("Offer images are required")
            .Must(images => images != null && images.Any())
            .WithMessage("At least one offer image is required")
            .Must(images => images != null && images.Count <= 10)
            .WithMessage("You can upload up to 10 offer images only");

        When(x => x.OfferImages != null && x.OfferImages.Any(), () =>
        {
            RuleForEach(x => x.OfferImages!)
                .ChildRules(img =>
                {
                    img.RuleFor(x => x.Length)
                        .GreaterThan(0)
                        .WithMessage("Offer image file cannot be empty");

                    img.RuleFor(x => x.Length)
                        .LessThanOrEqualTo(5 * 1024 * 1024)
                        .WithMessage("Each offer image must be less than 5MB");
                });
        });

        // WANTED IMAGES 
        When(x => x.WantedImages != null && x.WantedImages.Any(), () =>
        {
            RuleFor(x => x.WantedImages!)
                .Must(images => images.Count <= 10)
                .WithMessage("You can upload up to 10 wanted images only");

            RuleForEach(x => x.WantedImages!)
                .ChildRules(img =>
                {
                    img.RuleFor(x => x.Length)
                        .GreaterThan(0);

                    img.RuleFor(x => x.Length)
                        .LessThanOrEqualTo(5 * 1024 * 1024);
                });
        });
    }
}