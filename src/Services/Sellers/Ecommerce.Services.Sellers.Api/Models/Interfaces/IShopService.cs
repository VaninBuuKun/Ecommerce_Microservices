using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Sellers.Api.Models.Dtos;

namespace Ecommerce.Services.Sellers.Api.Models.Interfaces;

public interface IShopService
{
    Task<Result<PagedResult<ShopDto>>> GetAllShopsAsync(int pageNumber, int pageSize, string? searchTerm, string? status);
    Task<Result<SellerProfileDto>> GetMySellerProfileAsync(long userId);
    Task<Result<ShopDto>> GetShopByIdAsync(long id, long userId);
    Task<Result<ShopDto>> GetPublicShopByIdAsync(long id);
    Task<Result<List<ShopDto>>> GetPublicShopsByOwnerIdAsync(long ownerUserId);
    Task<Result<ShopDto>> CreateShopAsync(long ownerUserId, string name, string description, string logoUrl);
    Task<Result<ShopDto>> UpdateShopAsync(long id, long ownerUserId, string name, string description, string? logoUrl, string recipientName, string phone, string addressLine, long provinceId, long districtId, long wardId);
    Task<Result> SuspendShopAsync(long id, long userId, bool isAdmin);
    Task<Result> ActivateShopAsync(long id, long userId, bool isAdmin);
    Task<Result> BanShopAsync(long id);
    Task<Result<ValidateShopOwnerDto>> ValidateShopOwnerAsync(long shopId, long userId);
    Task<Result<List<ShopDto>>> GetShopsByIdsAsync(List<long> shopIds);
    Task<Result<ShopShippingInfoDto>> GetShopShippingInfoAsync(long shopId);
    Task<Result<List<ShopShippingInfoDto>>> GetShopsShippingInfoAsync(List<long> shopIds);
    Task<Result<bool>> ToggleFollowShopAsync(long customerId, long shopId);
    Task<Result<List<ShopDto>>> GetFollowedShopsAsync(long customerId);
    Task<Result<bool>> CheckFollowStatusAsync(long customerId, long shopId);
}
