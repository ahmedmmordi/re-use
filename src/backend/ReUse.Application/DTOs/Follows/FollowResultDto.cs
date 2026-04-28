
namespace ReUse.Application.DTOs.Follows;

public class FollowResultDto
{
    public Guid FollowingId { get; set; }
    public string FullName { get; set; } = null!;
    public bool IsNowFollowing { get; set; }
}