using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.Login;

public class LoginDto
{
    [Required, MaxLength(255), EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    [DataType(DataType.Password)]
    public string Password { get; set; } = null!;
}