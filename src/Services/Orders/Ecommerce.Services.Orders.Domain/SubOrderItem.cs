using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

public class SubOrderItem : EntityTrackingBase<Guid>
{
    public Guid SubOrderId { get; set; }
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; }
    public string VariantName { get; set; }
    
    public SubOrder SubOrder { get; set; }
}