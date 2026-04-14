using FluentValidation;

namespace ReUse.Application.DTOs.Users.Account_Management.Commands;

public class DeleteAccountValidator : AbstractValidator<DeleteAccountCommand>
{
    private const string RequiredConfirmation = "DELETE MY ACCOUNT";

    public DeleteAccountValidator()
    {
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");

        RuleFor(x => x.Confirmation)
            .NotEmpty().WithMessage("Confirmation phrase is required.")
            .Equal(RequiredConfirmation)
            .WithMessage($"You must type exactly \"{RequiredConfirmation}\" to confirm deletion.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.")
            .When(x => x.Reason is not null);
    }
}