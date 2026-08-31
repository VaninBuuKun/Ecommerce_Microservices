using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Services;

namespace Ecommerce.Services.Identity.Api.Models.Interfaces;

public record UserAddressDto(
    string RecipientName,
    string Phone,
    long ProvinceId,
    long DistrictId,
    long WardId,
    string AddressLine);

public class UpdateAddressDto
{
    public long Id { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public interface IAddressService
{
    Task<List<UserAddress>> GetAddressesByUserIdAsync(long userId);
    Task<UserAddress> CreateAddressAsync(long userId, CreateAddressDto dto);
    Task<UserAddress?> UpdateAddressAsync(long userId, UpdateAddressDto dto);
    Task<bool> DeleteAddressAsync(long userId, long addressId);
    Task<bool> SetDefaultAddressAsync(long userId, long addressId);
    Task<Result<UserAddressDto>> GetAddressByIdAsync(long addressId, long userId);
}
