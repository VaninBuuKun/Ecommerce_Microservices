using System.ComponentModel.DataAnnotations.Schema;
using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Orders.Domain.Rules;

namespace Ecommerce.Services.Orders.Domain;

public sealed class Order : AggregateRoot<Guid>, IDateTracking
{   
    public long CustomerId { get; }
    public OrderStatus Status { get; private set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }

    private Order() {}
    
    public decimal TotalPrice { get; private set; }
    
    public Order(long customerId)
    {
        CustomerId = customerId;
        Status = OrderStatus.Confirmed;
        TotalPrice = 0;
    }

    public void AddItem(Guid vanriantId, string productName, string variantName, decimal unitPrice, int quantity)
    {
        Check(new OrderItemPriceMustBePositiveRule(unitPrice));
        Check(new OrderItemQuantityMustBePositiveRule(quantity));
        
        var existingItem = OrderItems.SingleOrDefault(item => item.VariantId == vanriantId);

        if (existingItem != null)
        {
            throw new InvalidOperationException($"Variant with ID {vanriantId} is duplocated");
        }
        
        var item = new OrderItem
        {
            OrderId = this.Id,
            ProductName = productName,
            UnitPrice = unitPrice,
            Quantity = quantity,
            VariantId = vanriantId,
            VariantName = variantName
        };

        OrderItems.Add(item);
        TotalPrice = CalculateTotalPrice();
    }

    private decimal CalculateTotalPrice() => OrderItems.Sum(item => item.UnitPrice * item.Quantity);

    public void UpdateOrderStatus(OrderStatus newStatus)
    {
        Status = newStatus;
    }
}

public enum OrderStatus
{
    PaymentAwaiting, //Chờ thanh toán đối với thanh toán khác tiền mặt
    Confirmed, //Thanh toán hoàn tất (nếu tiền mặt thì vào đây luôn), Chuẩn bị hàng luôn
    Delivered, //<=> Completed
    Cancelled, //Shop hết hàng | Người dùng chủ động hủy.
    Failed
}