namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CustomerOrderResponse
{
    public Guid Id { get; set; }
    public int CustomerId { get; set; }
    public decimal TotalPrice { get; set; }
    
    public DateTimeOffset OrderDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public long PaymentMethodId { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string? PaymentUrl { get; set; }
    
    public ICollection<CustomerOrderItemDto> OrderItems { get; set; } = new List<CustomerOrderItemDto>();
    
}