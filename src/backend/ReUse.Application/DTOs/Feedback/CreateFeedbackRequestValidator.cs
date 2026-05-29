using FluentValidation;

namespace ReUse.Application.DTOs.Feedback;

public class CreateFeedbackRequestValidator : AbstractValidator<CreateFeedbackRequest>
{
    public CreateFeedbackRequestValidator()
    {
        RuleFor(x => x.RateeUserId)
            .NotEmpty().WithMessage("Ratee user is required.");

        RuleFor(x => x.Stars)
            .InclusiveBetween(1, 5).WithMessage("Stars must be between 1 and 5.");

        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Review comment is required.")
            .MaximumLength(1000).WithMessage("Review comment must not exceed 1000 characters.");
    }
}