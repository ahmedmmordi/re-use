using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ReUse.Infrastructure.Notifications.SignalR;

[Authorize]
public class NotificationHub : Hub
{

}