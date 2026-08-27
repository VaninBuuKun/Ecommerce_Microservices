using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

public class SubOrderItem : EntityTrackingBase<long>
{
    public long SubOrderId { get; set; }
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
        
    public SubOrder SubOrder { get; set; } = null!;

    public SubOrderItem() {}

    public SubOrderItem(long variantId, string productName, string variantName, decimal unitPrice, int quantity, string? thumbnailUrl = null)
    {
        VariantId = variantId;
        ProductName = productName;
        VariantName = variantName;
        UnitPrice = unitPrice;
        Quantity = quantity;
        ThumbnailUrl = thumbnailUrl;
    }
}