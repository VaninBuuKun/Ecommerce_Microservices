namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Users;

public class UserAddressDto
{
    public string Id { get; set; }
    public long UserId { get; set; }
    public string RecipientName { get; set; }
    public string Phone { get; set; } = null!;
    public string AddressLine { get; set; } = null!;
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; }
}