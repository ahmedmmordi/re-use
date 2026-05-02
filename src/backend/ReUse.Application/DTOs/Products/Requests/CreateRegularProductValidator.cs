using FluentValidation;

using ReUse.Application.DTOs.Products.Requests;

namespace ReUse.Application.DTOs.Products.Requests;

public class CreateRegularProductValidator : AbstractValidator<CreateRegularProductRequest>
{
    public CreateRegularProductValidator()
    {
        RuleFor(x => x.BasicInfo)
            .NotNull().WithMessage("BasicInfo is required")
            .SetValidator(new BasicInfoValidator());

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0")
            .LessThanOrEqualTo(1_000_000).WithMessage("Price is too high");

        RuleFor(x => x.AllowNegotiation)
            .NotNull();


        RuleFor(x => x.Images)
            .NotNull().WithMessage("Images are required")
            .Must(images => images != null && images.Count > 0)
            .WithMessage("At least one image is required")
            .Must(images => images != null && images.Count <= 10)
            .WithMessage("You can upload up to 10 images only");


        When(x => x.Images != null, () =>
        {
            RuleForEach(x => x.Images)
                .Must(img => img.Length > 0)
                .WithMessage("Image file cannot be empty")
                .Must(img => img.Length <= 5 * 1024 * 1024)
                .WithMessage("Each image must be less than 5MB");
        });
    }
}