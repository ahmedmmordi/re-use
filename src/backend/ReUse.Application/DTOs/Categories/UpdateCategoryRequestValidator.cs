using FluentValidation;
namespace ReUse.Application.DTOs.Categories;

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100)
            .Must(name => string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(name))
            .WithMessage("Name cannot be whitespace");

        RuleFor(x => x.Slug)
            .MaximumLength(100)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug))
            .WithMessage("Slug must be lowercase, hyphen-separated, and valid");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description != null);

        RuleFor(x => x.IconUrl)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.IconUrl))
            .WithMessage("IconUrl must be a valid URL");

        RuleFor(x => x.ParentId)
            .NotEqual(Guid.Empty)
            .When(x => x.ParentId.HasValue)
            .WithMessage("ParentId cannot be empty GUID");
    }

    private bool BeValidUrl(string? url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }
}