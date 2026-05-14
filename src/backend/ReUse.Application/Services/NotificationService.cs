using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Notification;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;

namespace ReUse.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NotificationDto>> GetUserNotifications(
      Guid userId,
      PaginationParams pagination)
    {
        var result = await _unitOfWork.Notifications
            .GetUserNotificationsAsync(userId, pagination.PageNumber, pagination.PageSize);

        return new PagedResult<NotificationDto>
        {
            Data = result.Data.Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type.ToString(),
                Data = JsonSerializer.Deserialize<object>(n.Data),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt
            }).ToList(),

            PageNumber = result.PageNumber,
            PageSize = result.PageSize,
            TotalRecords = result.TotalRecords
        };
    }

    public async Task<int> GetUnreadCount(Guid userId)
    {
        return await _unitOfWork.Notifications.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsRead(Guid userId, Guid notificationId)
    {
        if (notificationId == Guid.Empty)
            throw new BadRequestException("NotificationId cannot be empty");
        var notification = await _unitOfWork.Notifications
            .GetByIdAsync(notificationId);

        if (notification == null)
            throw new NotFoundException("Notification");

        if (notification.UserId != userId)
            throw new ForbiddenException("You cannot access this notification");

        notification.IsRead = true;
        await _unitOfWork.SaveChangesAsync();
    }
}