using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Sellers.Api.Models.Entities;

public enum ShopStatus
{
    Pending,
    Active,
    Suspended
}

public class PickUpAddress
{
    public string RecipientName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    public string District { get; private set; } = string.Empty;
    public string Ward { get; private set; } = string.Empty;
    public string AddressLine { get; private set; } = string.Empty;
    
    public long ProvinceId { get; private set; }
    public long DistrictId { get; private set; }
    public long WardId { get; private set; }

    private PickUpAddress() {}

    public PickUpAddress(string recipientName, string phone, string province, string district, string ward, string addressLine, long provinceId, long districtId, long wardId)
    {
        RecipientName = recipientName;
        Phone = phone;
        Province = province;
        District = district;
        Ward = ward;
        AddressLine = addressLine;
        ProvinceId = provinceId;
        DistrictId = districtId;
        wardId = wardId;
    }
}

public class Shop : EntityTrackingBase<long>
{
    public long OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public PickUpAddress PickUpAddress { get; set; } = null!;
    
    public ShopStatus Status { get; set; } = ShopStatus.Pending;
    public string? GhnShopId { get; set; }

    private Shop() {}

    public Shop(long ownerUserId, string name, string description, PickUpAddress pickUpAddress)
    {
        OwnerUserId = ownerUserId;
        Name = name;
        Description = description;
        PickUpAddress = pickUpAddress;
        Status = ShopStatus.Pending;
    }

    public void Approve()
    {
        Status = ShopStatus.Active;
    }

    public void Suspend()
    {
        Status = ShopStatus.Suspended;
    }
}
