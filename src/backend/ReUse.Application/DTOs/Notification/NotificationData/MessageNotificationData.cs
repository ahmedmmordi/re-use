namespace ReUse.Application.DTOs.Notification.NotificationData;

public class MessageNotificationData : INotificationData
{
    public Guid ChatId { get; set; }
    public Guid SenderId { get; set; }
}