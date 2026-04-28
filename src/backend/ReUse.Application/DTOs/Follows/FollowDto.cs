
namespace ReUse.Application.DTOs.Follows;

public class FollowDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public int FollowersCount { get; set; }
    // bool IsVerified { get; set; }
}