using FluentValidation;

namespace ReUse.Application.DTOs.Identity.EmailConfirmation;

public class ConfirmEmailRequestValidator : AbstractValidator<ConfirmEmailRequest>
{
    public ConfirmEmailRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress();

        RuleFor(x => x.Otp)
            .NotEmpty()
            .Length(6);
    }
}