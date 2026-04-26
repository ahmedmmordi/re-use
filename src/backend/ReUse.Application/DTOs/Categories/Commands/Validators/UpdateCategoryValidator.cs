using FluentValidation;

using ReUse.Application.DTOs.Categories.Commands;

public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
{
    public UpdateCategoryDtoValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100);

        RuleFor(x => x.Slug)
            .Matches("^[a-z0-9-]+$")
            .When(x => x.Slug != null)
            .WithMessage("Slug must be lowercase and valid");
    }
}