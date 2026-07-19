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
    public ICollection<SubOrderItem> SubOrderItems { get; set; } = new List<SubOrderItem>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public Order Order { get; private set; }

    private SubOrder() {}
    
    public SubOrder(long customerId, long shopId, bool isOnlinePayment)
    {
        CustomerId = customerId;
        ShopId = shopId;

        Status = isOnlinePayment ? SubOrderStatus.AwaitingPayment : SubOrderStatus.AwaitingConfirmation;
    }

    public void AddOrderItem(SubOrderItem subOrderItem)
    {
        var existingItem = SubOrderItems.SingleOrDefault(item => item.VariantId == subOrderItem.VariantId);

        if (existingItem != null)
        {
            throw new InvalidOperationException($"Order item with variant ID {subOrderItem.VariantId} already exists in the sub-order.");
        }
        
        SubOrderItems.Add(subOrderItem);

        CalculateSubTotal();
        CalculateGrandTotal();
    }

    public void UpdateSubOrderStatus(SubOrderStatus subOrderStatus)
    {
        Status = subOrderStatus;
    }
    
    private void CalculateSubTotal() 
    {
        SubTotal = (long)SubOrderItems.Sum(item => item.Quantity * item.UnitPrice);
    }

    private void CalculateGrandTotal() 
    {
        GrandTotal = SubTotal + ShippingFee - SellerDiscount - PlatformDiscount;
    }
}