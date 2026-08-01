namespace Ecommerce.Services.Shippings.Api.Models.Dtos;

public record ProvinceDto(long Id, string Name, string DisplayName);
public record DistrictDto(long Id, long ProvinceId, string Name, string DisplayName);
public record WardDto(long Id, long DistrictId, string Name, string DisplayName);
