namespace Ecommerce.Services.Shippings.Api.Models.Enums;

public enum ShipmentStatus
{
    ReadyToPick = 1, // Gom Created + ReadyToPick + Picking: Đã tạo đơn thành công, chờ/đang lấy hàng
    InTransit = 2,   // Đang vận chuyển (Đã rời kho/đang trên đường)
    Delivered = 3,   // Giao thành công
    Returned = 4,    // Hoàn trả thành công về Shop
    Cancelled = 5,   // Hủy đơn
    Failed = 6       // Lỗi (Tạo đơn đơn vị vận chuyển thất bại / Lỗi hệ thống)
}
