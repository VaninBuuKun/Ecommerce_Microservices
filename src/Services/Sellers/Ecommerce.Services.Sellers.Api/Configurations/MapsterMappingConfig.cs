using Ecommerce.Services.Sellers.Api.Models.Dtos;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Mapster;

namespace Ecommerce.Services.Sellers.Api.Configurations;

public class MapsterMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Shop, ShopDto>()
            .Map(dest => dest.RecipientName, src => src.PickUpAddress != null ? src.PickUpAddress.RecipientName : string.Empty)
            .Map(dest => dest.Phone, src => src.PickUpAddress != null ? src.PickUpAddress.Phone : string.Empty)
            .Map(dest => dest.AddressLine, src => src.PickUpAddress != null ? src.PickUpAddress.AddressLine : string.Empty)
            .Map(dest => dest.Province, src => src.PickUpAddress != null ? src.PickUpAddress.Province : string.Empty)
            .Map(dest => dest.District, src => src.PickUpAddress != null ? src.PickUpAddress.District : string.Empty)
            .Map(dest => dest.Ward, src => src.PickUpAddress != null ? src.PickUpAddress.Ward : string.Empty)
            .Map(dest => dest.ProvinceId, src => src.PickUpAddress != null ? src.PickUpAddress.ProvinceId : 0)
            .Map(dest => dest.DistrictId, src => src.PickUpAddress != null ? src.PickUpAddress.DistrictId : 0)
            .Map(dest => dest.WardId, src => src.PickUpAddress != null ? src.PickUpAddress.WardId : 0)
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.LogoUrl, src => src.LogoUrl ?? string.Empty);

        config.NewConfig<SellerKyc, SellerKycDto>()
            .Map(dest => dest.OwnerUserId, src => src.UserId)
            .Map(dest => dest.IdCardFrontUrl, src => src.IdentityCardFrontUrl)
            .Map(dest => dest.IdCardBackUrl, src => src.IdentityCardBackUrl)
            .Map(dest => dest.RejectionReason, src => src.RejectReason)
            .Map(dest => dest.Status, src => src.Status.ToString());
    }
}
