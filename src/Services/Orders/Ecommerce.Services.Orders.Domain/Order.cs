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
    public string RecipientWardId { get; private set; } = string.Empty;
    public int RecipientProvinceId { get; private set; }
    public int RecipientDistrictId { get; private set; }
    
    public IReadOnlyCollection<SubOrder> GetSubOrders() => SubOrderItems.ToList().AsReadOnly();
    
    
    private Order() {}
    
    [NotMapped]
    public bool IsOnlinePayment { get; private set; } //Xác định hình thức thanh toán, true: online, false: offline

    public Order(long customerId, string shippingAddress, bool isOnlinePayment, string recipientName, string recipientPhone, string recipientWardId, int recipientProvinceId, int recipientDistrictId)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        RecipientName = recipientName;
        RecipientPhone = recipientPhone;
        RecipientWardId = recipientWardId;
        RecipientProvinceId = recipientProvinceId;
        RecipientDistrictId = recipientDistrictId;

        IsOnlinePayment = isOnlinePayment;
    }
    
    private SubOrder CreateSubOrder(long shopId)
    {
        var subOrder = new SubOrder(CustomerId, shopId, IsOnlinePayment);
        
        SubOrderItems.Add(subOrder);
        return subOrder;
    }

    public SubOrderItem AddOrderItem(long ShopId, Guid VariantId, string ProductName, string VariantName, decimal unitPrice, int quantity)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == ShopId) ?? CreateSubOrder(ShopId);
        
        
        var orderItem = new SubOrderItem
        {
            SubOrderId = subOrder.Id,
            ProductName = ProductName,
            UnitPrice = unitPrice,
            Quantity = quantity,
            VariantId = VariantId,
            VariantName = VariantName
        };
        
        subOrder.AddOrderItem(orderItem);
        CalculateSubTotal();
        CalculateShippingFee();
        CalculateTotalDiscount();
        CalculateGrandTotal();

        return orderItem;
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
