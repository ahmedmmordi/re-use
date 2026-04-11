using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.Register;

public class RegisterDto
{
    [Required, MaxLength(256)]
    public string UserName { get; set; } = null!;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = null!;

    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [MaxLength(255)]
    [DataType(DataType.Password)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$",
        ErrorMessage = "Password must contain upper, lower, digit, and special character."
    )]
    public string Password { get; set; } = null!;
}