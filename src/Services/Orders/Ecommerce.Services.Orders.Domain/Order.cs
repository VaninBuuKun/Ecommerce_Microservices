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
    
    public IReadOnlyCollection<SubOrder> GetSubOrders() => SubOrderItems.ToList().AsReadOnly();
    
    
    private Order() {}
    
    [NotMapped]
    public bool IsOnlinePayment { get; private set; } //Xác định hình thức thanh toán, true: online, false: offline

    public Order(long customerId, string shippingAddress, bool isOnlinePayment)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;

        IsOnlinePayment = isOnlinePayment;
    }
    
    private SubOrder CreateSubOrder(long shopId)
    {
        var existsingSubOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == shopId);

        if (existsingSubOrder != null)
        {
            throw new InvalidOperationException($"SubOrder for shop with ID {shopId} already exists.");
        }
        
        var subOrder = new SubOrder(shopId, CustomerId, IsOnlinePayment);
        
        SubOrderItems.Add(subOrder);
        return subOrder;
    }

    public OrderItem AddOrderItem(long ShopId, Guid VariantId, string ProductName, string VariantName, decimal unitPrice, int quantity)
    {
        var subOrder = SubOrderItems.SingleOrDefault(o => o.ShopId == ShopId) ?? CreateSubOrder(ShopId);
        
        var orderItem = new OrderItem
        {
            OrderId = this.Id,
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
    

    private decimal CalculateSubTotal() => SubOrderItems.Sum(item => item.SubTotal);
    private decimal CalculateGrandTotal() => SubOrderItems.Sum(item => item.GrandTotal);
    private decimal CalculateTotalDiscount() => SubOrderItems.Sum(item => item.SellerDiscount + item.PlatformDiscount);
    private decimal CalculateShippingFee() => SubOrderItems.Sum(item => item.ShippingFee);
    
}


//Awaiting Payment, Cancelled, status cha có thể dùng.
