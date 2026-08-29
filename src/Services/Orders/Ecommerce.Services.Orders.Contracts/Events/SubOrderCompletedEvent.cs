using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderCompletedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
    public long ShopId { get; init; }
    /// <summary>Tổng giá trị đơn hàng phụ (đơn vị VND).</summary>
    public long TotalAmount { get; init; }
    /// <summary>
    /// Phần sàn tự bỏ ra giảm giá (Platform Voucher). 
    /// Doanh thu thực tế người bán nhận = TotalAmount - PlatformDiscount.
    /// </summary>
    public long PlatformDiscount { get; init; }
    public List<SubOrderCompletedItemContract> Items { get; init; } = new();
}

public class SubOrderCompletedItemContract
{
    public long VariantId { get; init; }
    public int Quantity { get; init; }
}
