namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;

public class PaymentMethodDto
{
    public long Id { get; set; }
    public string Title { get; set; }
    public string SubTitle { get; set; }
    public string ProviderName  { get; set; }
    public string IconUrl { get; set; }
    public bool IsActive { get; set; }
    public decimal? MinAmount { get; set; }
}