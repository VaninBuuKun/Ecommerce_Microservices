using System;
using Ecommerce.Services.Identity.Api.Models.Entities;

namespace Ecommerce.Services.Identity.Api.Models.Entities;

public class UserAddress
{
    public Guid Id { get; set; }
    public long UserId { get; set; }
    public AppUser User { get; set; } = null!;
    
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    public int ProvinceId { get; set; }
    public int DistrictId { get; set; }
    public string WardCode { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    
    public bool IsDefault { get; set; }
}
