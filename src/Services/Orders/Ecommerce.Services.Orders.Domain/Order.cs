using System.ComponentModel.DataAnnotations.Schema;
using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Orders.Domain.Rules;
using MediatR;

namespace Ecommerce.Services.Orders.Domain;

public sealed class Order : AggregateRoot<Guid>, IDateTracking
{   
    public long CustomerId { get; private set; }
    public ICollection<SubOrder> SubOrderItems { get; private set; } = new List<SubOrder>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public long SubTotal { get; private set; } //Tính theo sum(unitprice * quantity)
    public long ShippingFee { get; private set; }
    public long TotalDiscount { get; private set; }
    public long GrandTotal { get; private set; }
    
    public string ShippingAddress { get; private set; } = string.Empty; //Địa điểm giao
    public string RecipientName { get; private set; } = string.Empty;
    public string RecipientPhone { get; private set; } = string.Empty;
    public long RecipientWardId { get; private set; }
    
    public IReadOnlyCollection<SubOrder> GetSubOrders() => SubOrderItems.ToList().AsReadOnly();
    
    
    private Order() {}
    
    [NotMapped]
    public bool IsOnlinePayment { get; private set; } //Xác định hình thức thanh toán, true: online, false: offline

    public Order(long customerId, string shippingAddress, bool isOnlinePayment, string recipientName, string recipientPhone, long recipientWardId)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        RecipientName = recipientName;
        RecipientPhone = recipientPhone;
        RecipientWardId = recipientWardId;
        IsOnlinePayment = isOnlinePayment;
    }
    
    private SubOrder CreateSubOrder(long shopId)
    {
        var subOrder = new SubOrder(CustomerId, shopId, IsOnlinePayment);
        
        SubOrderItems.Add(subOrder);
        return subOrder;
    }

    public SubOrderItem AddOrderItem(long ShopId, Guid productId, Guid VariantId, string ProductName, string VariantName, decimal unitPrice, int quantity, string thumbnaiLUrl)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == ShopId) ?? CreateSubOrder(ShopId);
        
        
        var orderItem = new SubOrderItem
        {
            SubOrderId = subOrder.Id,
            ProductId = productId,
            ProductName = ProductName,
            UnitPrice = unitPrice,
            Quantity = quantity,
            VariantId = VariantId,
            VariantName = VariantName,
            ThumbnailUrl = thumbnaiLUrl
        };
        
        subOrder.AddOrderItem(orderItem);
        CalculateSubTotal();
        CalculateShippingFee();
        CalculateTotalDiscount();
        CalculateGrandTotal();

        return orderItem;
    }

    public void SetShippingFee(long shopId, decimal shippingFee)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == shopId);
        if (subOrder != null)
        {
            subOrder.SetShippingFee((long)shippingFee);
            CalculateShippingFee();
            CalculateGrandTotal();
        }
    }

    public void ApplyDiscounts(long shopId, decimal sellerDiscount, decimal platformDiscount)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == shopId);
        if (subOrder != null)
        {
            subOrder.SetDiscounts((long)sellerDiscount, (long)platformDiscount);
            CalculateTotalDiscount();
            CalculateGrandTotal();
        }
    }

    /// <summary>
    /// Gán ID các voucher đã áp dụng vào SubOrder tương ứng.
    /// Dùng để hỗ trợ rollback khi hủy đơn.
    /// </summary>
    public void ApplyVoucherIds(long shopId, Guid? shopVoucherId, Guid? platformVoucherId)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == shopId);
        subOrder?.ApplyVouchers(shopVoucherId, platformVoucherId);
    }
    

    private void CalculateSubTotal() 
    {
        SubTotal = SubOrderItems.Sum(item => item.SubTotal);
    }

    private void CalculateGrandTotal() 
    {
        GrandTotal = SubOrderItems.Sum(item => item.GrandTotal);
    }

    private void CalculateTotalDiscount() 
    {
        TotalDiscount = SubOrderItems.Sum(item => item.SellerDiscount + item.PlatformDiscount);
    }

    private void CalculateShippingFee() 
    {
        ShippingFee = SubOrderItems.Sum(item => item.ShippingFee);
    }
}


//Awaiting Payment, Cancelled, status cha có thể dùng.
