// ReUse.Application/DTOs/Users/UserManagement/Contracts/UserDto.cs
namespace ReUse.Application.DTOs.Users.UserManagement.Contracts;

public record UserDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string? Username { get; init; }
    public string? ProfilePictureUrl { get; init; }
    public string? PhoneNumber { get; init; }
    public string Status { get; init; } = null!;
    public bool IsVerified { get; init; }
    public IEnumerable<string> Roles { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
}