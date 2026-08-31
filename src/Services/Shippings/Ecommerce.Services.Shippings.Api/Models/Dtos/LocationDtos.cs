namespace Ecommerce.Services.Shippings.Api.Models.Dtos;

public record ProvinceDto(long Id, string Name, string DisplayName);
public record DistrictDto(long Id, long ProvinceId, string Name, string DisplayName);
public record WardDto(long Id, long DistrictId, string Name, string DisplayName);
public record LocationSummaryDto(long ProvinceId, string ProvinceName, long DistrictId, string DistrictName, long WardId, string WardName);
public record LocationResolveBatchRequest(List<long> WardIds);
