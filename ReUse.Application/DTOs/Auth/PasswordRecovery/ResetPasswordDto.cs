using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.PasswordRecovery;

public class ResetPasswordDto
{
    [Required]
    public string ResetToken { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [DataType(DataType.Password)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$",
        ErrorMessage = "Password must contain upper, lower, digit, and special character."
    )]
    public string NewPassword { get; set; } = null!;
}