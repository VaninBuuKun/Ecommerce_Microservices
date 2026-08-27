using System;
using Ecommerce.Services.Identity.Api.Models.Entities;

namespace Ecommerce.Services.Identity.Api.Models.Entities;

public class UserAddress
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public AppUser User { get; set; } = null!;
    
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; } 
    public string AddressLine { get; set; } = string.Empty;
    
    public bool IsDefault { get; set; }
}
