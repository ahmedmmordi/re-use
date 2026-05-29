namespace ReUse.Application.DTOs.Notification.NotificationData;

public class FeedbackReceivedNotificationData : INotificationData
{
    public Guid RaterId { get; set; }
    public string RaterName { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Guid FeedbackId { get; set; }
    public int Stars { get; set; }
}