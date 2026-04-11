using FluentValidation;

namespace ReUse.Application.DTOs.Users.UserProfile.Commands;

public class UpdateUserProfileValidator : AbstractValidator<UpdateUserProfileCommand>
{
    public UpdateUserProfileValidator()
    {
        RuleFor(x => x.FullName)
            .MaximumLength(100)
            .WithMessage("Full name must not exceed 100 characters.")
            .Matches(@"^[a-zA-Z\s'-]+$")
            .WithMessage("Full name can only contain letters, spaces, hyphens, and apostrophes.")
            .When(x => x.FullName is not null);

        RuleFor(x => x.PhoneNumber)
            .Must(BeValidPhone)
            .WithMessage("Phone number must be valid (Egyptian local or international format).")
            .When(x => x.PhoneNumber is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(500)
            .WithMessage("Bio must not exceed 500 characters.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.AddressLine1)
            .MaximumLength(200)
            .WithMessage("Address line must not exceed 200 characters.")
            .When(x => x.AddressLine1 is not null);

        RuleFor(x => x.City)
            .MaximumLength(100)
            .WithMessage("City must not exceed 100 characters.")
            .Matches(@"^[a-zA-Z\s\-]+$")
            .WithMessage("City can only contain letters, spaces, and hyphens.")
            .When(x => x.City is not null);

        RuleFor(x => x.StateProvince)
            .MaximumLength(100)
            .WithMessage("State/Province must not exceed 100 characters.")
            .When(x => x.StateProvince is not null);

        RuleFor(x => x.PostalCode)
            .MaximumLength(20)
            .WithMessage("Postal code must not exceed 20 characters.")
            .Matches(@"^[a-zA-Z0-9\s\-]+$")
            .WithMessage("Postal code can only contain letters, numbers, spaces, and hyphens.")
            .When(x => x.PostalCode is not null);

        RuleFor(x => x.Country)
            .MaximumLength(100)
            .WithMessage("Country must not exceed 100 characters.")
            .Matches(@"^[a-zA-Z\s\-]+$")
            .WithMessage("Country can only contain letters, spaces, and hyphens.")
            .When(x => x.Country is not null);
    }

    private bool BeValidPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return false;

        phone = phone.Trim();

        // 🇪🇬 Egyptian local number (11 digits starts with 01)
        if (phone.StartsWith("01"))
        {
            return phone.Length == 11
                   && phone.All(char.IsDigit);
        }

        //  International format (+123456789...)
        if (phone.StartsWith("+"))
        {
            var withoutPlus = phone.Substring(1);

            return withoutPlus.Length >= 8
                   && withoutPlus.Length <= 15
                   && withoutPlus.All(char.IsDigit);
        }

        return false;
    }
}