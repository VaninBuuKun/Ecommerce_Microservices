namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Sellers;

public class ShopShippingInfoDto
{
    public long ShopId { get; set; }
    public string ShopName { get; set; }
    public string Phone { get; set; }
    public string AddressLine { get; set; }
    public long WardId { get; set; }
    public long DistrictId { get; set; }
    public long ProvinceId { get; set; }
    public string RecipientName { get; set; }
}
