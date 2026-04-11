using System.ComponentModel.DataAnnotations;

namespace ReUse.Application.DTOs.Auth.Refresh;

public class RefreshTokenRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = null!;
}