namespace Ecommerce.Services.Shippings.Api.Models.Dtos;

public record ProvinceDto(string Id, string Name, string DisplayName);
public record DistrictDto(string Id, string ProvinceId, string Name, string DisplayName);
public record WardDto(string Id, string DistrictId, string Name, string DisplayName);
