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
    public double WeightInGrams { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
        
    public SubOrder SubOrder { get; set; } = null!;

    public SubOrderItem() {}

    public SubOrderItem(
        long variantId,
        string productName,
        string variantName,
        decimal unitPrice,
        int quantity,
        string? thumbnailUrl = null,
        double weightInGrams = 0,
        double length = 0,
        double width = 0,
        double height = 0)
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