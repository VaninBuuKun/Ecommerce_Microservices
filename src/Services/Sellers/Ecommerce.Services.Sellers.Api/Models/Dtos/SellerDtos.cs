namespace Ecommerce.Services.Sellers.Api.Models.Dtos;

public class ValidateShopOwnerDto
{
    public bool IsOwner { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ShopShippingInfoDto
{
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public long WardId { get; set; }
    public long DistrictId { get; set; }
    public long ProvinceId { get; set; }
    public long OwnerUserId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
}

public class ShopDto
{
    public long Id { get; set; }
    public long OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; }
}

public class SellerProfileDto
{
    public string KycStatus { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public SellerKycDto? Kyc { get; set; }
    public List<ShopDto> Shops { get; set; } = [];
}

public class SellerKycDto
{
    public long Id { get; set; }
    public long OwnerUserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string IdentityCardNumber { get; set; } = string.Empty;
    public string IdCardFrontUrl { get; set; } = string.Empty;
    public string IdCardBackUrl { get; set; } = string.Empty;
    public string TaxNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
}
