using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Domain;

public class SubOrder : EntityTrackingBase<Guid>
{
    public Guid OrderId { get; set; }
    public long CustomerId { get; private set; }
    public long ShopId { get; private set; }
    
    public long SubTotal { get; private set; } //Tính theo sum(unitprice * quantity)
    public long ShippingFee { get; private set; }
    public long SellerDiscount { get; private set; } //Theo voucher
    public long PlatformDiscount { get; private set; } //Theo sàn
    public long GrandTotal { get; private set; }
    
    public SubOrderStatus Status { get; private set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public Order Order { get; private set; }
    
    public SubOrder(long customerId, long shopId, bool isOnlinePayment)
    {
        CustomerId = customerId;
        ShopId = shopId;

        Status = isOnlinePayment ? SubOrderStatus.AwaitingPayment : SubOrderStatus.AwaitingConfirmation;
    }

    public void AddOrderItem(OrderItem orderItem)
    {
        var existingItem = OrderItems.SingleOrDefault(item => item.VariantId == orderItem.VariantId);

        if (existingItem != null)
        {
            throw new InvalidOperationException($"Order item with variant ID {orderItem.VariantId} already exists in the sub-order.");
        }
        
        OrderItems.Add(orderItem);
    }

    public void UpdateSubOrderStatus(SubOrderStatus subOrderStatus)
    {
        Status = subOrderStatus;
    }

    public decimal CalculateSubTotal()
    {
        return OrderItems.Sum(item => item.UnitPrice * item.Quantity);
    }
}