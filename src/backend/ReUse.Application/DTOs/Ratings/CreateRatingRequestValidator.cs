using FluentValidation;

namespace ReUse.Application.DTOs.Ratings;

public class CreateRatingRequestValidator : AbstractValidator<CreateRatingRequest>
{
    public CreateRatingRequestValidator()
    {
        RuleFor(x => x.RateeUserId)
            .NotEmpty().WithMessage("Ratee user is required.");

        RuleFor(x => x.Stars)
            .InclusiveBetween(1, 5).WithMessage("Stars must be between 1 and 5.");
    }
}