using FluentValidation;

using ReUse.Application.DTOs.Products.Requests;

namespace ReUse.Application.DTOs.Products.Requests;

public class CreateWantedProductValidator : AbstractValidator<CreateWantedProductRequest>
{
    public CreateWantedProductValidator()
    {

        RuleFor(x => x.BasicInfo)
            .NotNull().WithMessage("BasicInfo is required")
            .SetValidator(new BasicInfoValidator());


        RuleFor(x => x.DesiredPriceMin)
            .GreaterThan(0).WithMessage("Minimum desired price must be greater than 0");


        RuleFor(x => x.DesiredPriceMax)
            .GreaterThan(0).WithMessage("Maximum desired price must be greater than 0");


        RuleFor(x => x)
            .Must(x => x.DesiredPriceMax >= x.DesiredPriceMin)
            .WithMessage("Maximum price must be greater than or equal to minimum price");


        RuleFor(x => x.Images)
            .NotNull().WithMessage("Images are required")
            .NotEmpty().WithMessage("At least one image is required")
            .Must(images => images.Count <= 10)
            .WithMessage("You can upload up to 10 images only");

        RuleForEach(x => x.Images)
            .Must(img => img.Length > 0)
            .WithMessage("Image file cannot be empty")
            .Must(img => img.Length <= 5 * 1024 * 1024)
            .WithMessage("Each image must be less than 5MB");
    }
}