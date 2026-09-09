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
    
    // Snapshot metrics
    public int WeightInGrams { get; set; }
    public int Length { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
        
    public SubOrder SubOrder { get; set; } = null!;

    public SubOrderItem() {}

    public SubOrderItem(
        long variantId,
        string productName,
        string variantName,
        decimal unitPrice,
        int quantity,
        string? thumbnailUrl = null,
        int weightInGrams = 0,
        int length = 0,
        int width = 0,
        int height = 0)
    {
        VariantId = variantId;
        ProductName = productName;
        VariantName = variantName;
        UnitPrice = unitPrice;
        Quantity = quantity;
        ThumbnailUrl = thumbnailUrl;
        WeightInGrams = weightInGrams;
        Length = length;
        Width = width;
        Height = height;
    }
}