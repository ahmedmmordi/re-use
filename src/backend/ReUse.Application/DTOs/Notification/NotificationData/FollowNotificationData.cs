namespace ReUse.Application.DTOs.Notification.NotificationData;

public class FollowNotificationData : INotificationData
{
    public Guid FollowerId { get; set; }
    public string Username { get; set; } = null!;
}