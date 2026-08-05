using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Sellers.Api.Models.Entities;

public enum ShopStatus
{
    Active,
    Suspended,
    Banned
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
        WardId = wardId;
    }
}

public class Shop : EntityTrackingBase<long>
{
    public long OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    
    public PickUpAddress? PickUpAddress { get; set; } = null!;
    
    public ShopStatus Status { get; set; } = ShopStatus.Active;

    private Shop() {}

    public Shop(long ownerUserId, string name, string description,string? logoUrl = null)
    {
        OwnerUserId = ownerUserId;
        Name = name;
        Description = description;
        LogoUrl = logoUrl;
        Status = ShopStatus.Active;
    }

    public void Activate()
    {
        if (Status == ShopStatus.Banned)
        {
            throw new InvalidOperationException("Không thể kích hoạt lại cửa hàng đã bị khóa.");
        }

        Status = ShopStatus.Active;
    }

    public void Suspend()
    {
        if (Status == ShopStatus.Banned)
        {
            throw new InvalidOperationException("Cửa hàng đã bị khóa, không thể tạm ẩn.");
        }

        Status = ShopStatus.Suspended;
    }

    public void Ban()
    {
        Status = ShopStatus.Banned;
    }
}
