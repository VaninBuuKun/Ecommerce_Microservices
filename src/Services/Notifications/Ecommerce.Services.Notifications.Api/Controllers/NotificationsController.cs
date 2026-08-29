using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Notifications.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    private long UserId => long.Parse(User.FindFirst("sub")?.Value
                                     ?? User.FindFirst("userId")?.Value
                                     ?? "0");

    /// <summary>Lấy danh sách notification của người dùng hiện tại (có phân trang).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Notification>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var notifications = await notificationService.GetByUserIdAsync(UserId, page, pageSize, cancellationToken);
        return Ok(notifications);
    }



    /// <summary>Đánh dấu một notification đã đọc.</summary>
    [HttpPut("{notificationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid notificationId, CancellationToken cancellationToken = default)
    {
        await notificationService.MarkAsReadAsync(notificationId, UserId, cancellationToken);
        return NoContent();
    }

    /// <summary>Đánh dấu tất cả notification đã đọc.</summary>
    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        await notificationService.MarkAllAsReadAsync(UserId, cancellationToken);
        return NoContent();
    }
}
