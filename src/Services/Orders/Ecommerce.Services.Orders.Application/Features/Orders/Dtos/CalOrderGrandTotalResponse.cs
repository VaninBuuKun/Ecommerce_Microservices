namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CalOrderGrandTotalResponse
{
    public string QuoteId { get; set; }
    public decimal GrandTotal { get; set; }
}