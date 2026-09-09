using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class PaymentMethod : EntityTrackingBase<long>
{
    public string Title { get; set; }
    public string? SubTitle { get; set; }
    public bool IsActive { get; set; } //Phương thức này đã đi vào hoạt động chưa
    public string ProviderName { get; set; } // momo,cod, vnpay, wallet dựa vào đây để quyết định stategy nào
    public string IconUrl  { get; set; } 
    public decimal? MinAmount { get; set; }
}
