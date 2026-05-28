namespace ReUse.Application.DTOs.Notification.NotificationData;

public class RatingReceivedNotificationData : INotificationData
{
    public Guid RaterId { get; set; }
    public string RaterName { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Guid RatingId { get; set; }
    public int Stars { get; set; }
}