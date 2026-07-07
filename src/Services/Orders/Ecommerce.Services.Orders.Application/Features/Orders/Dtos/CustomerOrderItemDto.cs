namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CustomerOrderItemDto
{
    public Guid OrderId { get; set; }
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; }
}   