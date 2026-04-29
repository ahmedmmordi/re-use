using FluentValidation;

namespace ReUse.Application.DTOs.Identity.PasswordReset;

public class RequestPasswordResetRequestValidator
    : AbstractValidator<RequestPasswordResetRequest>
{
    public RequestPasswordResetRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress();
    }
}