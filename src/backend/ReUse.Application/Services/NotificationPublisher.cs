using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class NotificationPublisher : INotificationPublisher
{
    private readonly INotificationFactory _factory;
    private readonly INotificationDispatcher _dispatcher;

    public NotificationPublisher(INotificationFactory factory, INotificationDispatcher dispatcher)
    {
        _factory = factory;
        _dispatcher = dispatcher;
    }

    public async Task PublishAsync<T>(
        Guid userId,
        NotificationType type,
        string title,
        string body,
        T data) where T : INotificationData
    {
        var notification = _factory.Create(
            userId,
            type,
            title,
            body,
            data,
            new[]
            {
                NotificationChannel.InApp
            });

        await _dispatcher.DispatchAsync(notification);
    }

    public async Task PublishToMultipleAsync<T>(
        IEnumerable<Guid> userIds,
        NotificationType type,
        string title,
        string body,
        T data) where T : INotificationData
    {
        await Task.WhenAll(
            userIds.Select(id =>
                PublishAsync(id, type, title, body, data)
            ));
    }
}