using System;

namespace Ecommerce.Services.Notifications.Api.Models.Entities;

/// <summary>
/// Đại diện cho một phòng chat giữa Buyer (Người mua) và Cửa hàng (Shop).
/// Khóa tự nhiên duy nhất xác định phòng chat là cặp (ShopId, BuyerUserId).
/// </summary>
public class ChatRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Mã Cửa hàng (Shop)</summary>
    public long ShopId { get; set; }

    /// <summary>UserId của Buyer (Người mua)</summary>
    public long BuyerUserId { get; set; }

    /// <summary>Nội dung tin nhắn cuối cùng để hiển thị preview</summary>
    public string LastMessage { get; set; } = string.Empty;

    /// <summary>Thời gian hoạt động cuối cùng của phòng chat</summary>
    public DateTimeOffset LastActiveAt { get; set; } = DateTimeOffset.UtcNow;
}
