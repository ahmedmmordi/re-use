using FluentValidation;

namespace ReUse.Application.DTOs.Identity.EmailConfirmation;

public class SendEmailConfirmationRequestValidator : AbstractValidator<SendEmailConfirmationRequest>
{
    public SendEmailConfirmationRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress();
    }
}