using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderCompletedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
    public long ShopId { get; init; }
    /// <summary>Tổng giá trị đơn hàng phụ (đơn vị VND, tổng cộng tất cả + phí, grandTotal).</summary>
    public long TotalAmount { get; init; } 
    /// <summary>
    /// Phần sàn tự bỏ ra giảm giá (Platform Voucher). 
    /// Doanh thu thực tế người bán nhận = TotalAmount - PlatformDiscount.
    /// </summary>
    public long PlatformDiscount { get; init; }
    /// <summary>Tỷ lệ hoa hồng sàn snapshot (ví dụ: 5.0m)</summary>
    public decimal CommissionRate { get; init; }
    /// <summary>Số tiền hoa hồng sàn thu snapshot (VND)</summary>
    public long CommissionFee { get; init; }
    /// <summary>Số tiền thực nhận của người bán snapshot (VND)</summary>
    public long NetRevenue { get; init; }
    public long CustomerId { get; init; }
    public List<SubOrderCompletedItemContract> Items { get; init; } = new();
}

public class SubOrderCompletedItemContract
{
    public long VariantId { get; init; }
    public long ProductId { get; init; }
    public long? CategoryId { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string? ThumbnailUrl { get; init; }
}
