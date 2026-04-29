using FluentValidation;
namespace ReUse.Application.DTOs.Identity.PasswordReset;

public class VerifyPasswordResetRequestValidator
    : AbstractValidator<VerifyPasswordResetRequest>
{
    public VerifyPasswordResetRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress();

        RuleFor(x => x.Otp)
            .NotEmpty();
    }
}