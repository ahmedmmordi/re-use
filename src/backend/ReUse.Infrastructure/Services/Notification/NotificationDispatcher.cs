using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

using ReUse.Application.DTOs.Notification;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Notifications;
using ReUse.Infrastructure.Notifications.SignalR;

namespace ReUse.Application.Services;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEnumerable<INotificationChannelHandler> _handlers;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(IUnitOfWork unitOfWork, IEnumerable<INotificationChannelHandler> handlers, ILogger<NotificationDispatcher> logger)
    {
        _unitOfWork = unitOfWork;
        _handlers = handlers;
        _logger = logger;
    }

    public async Task DispatchAsync(Notification notification)
    {
        await _unitOfWork.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        foreach (var delivery in notification.Deliveries)
        {
            var handler = _handlers.FirstOrDefault(x =>
                x.Channel == delivery.Channel);

            if (handler == null)
            {
                _logger.LogWarning(
                    "No handler found for channel {Channel}",
                    delivery.Channel);

                continue;
            }

            await handler.SendAsync(notification);
        }

        await _unitOfWork.SaveChangesAsync();


        _logger.LogInformation(
            "Notification {NotificationId} dispatched to user {UserId}",
            notification.Id,
            notification.UserId);
    }
}