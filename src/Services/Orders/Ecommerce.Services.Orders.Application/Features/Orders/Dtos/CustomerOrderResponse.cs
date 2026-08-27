namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CustomerOrderResponse
{
    public long Id { get; set; }
    public long CustomerId { get; set; }
    public decimal GrandTotal { get; set; }
    public string Status { get; set; } = string.Empty;
    
    public DateTimeOffset OrderDate { get; set; }
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public long PaymentMethodId { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string? PaymentUrl { get; set; }
    
    public ICollection<CustomerOrderItemDto> OrderItems { get; set; } = new List<CustomerOrderItemDto>();
}