using FluentValidation;

namespace ReUse.Application.DTOs.Users.AccountManagement;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$")
            .WithMessage("New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.")
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("New password must be different from the current password.");

        RuleFor(x => x.ConfirmNewPassword)
          .NotEmpty().WithMessage("Confirm password is required.")
          .Equal(x => x.NewPassword)
          .WithMessage("Passwords do not match.");
    }
}