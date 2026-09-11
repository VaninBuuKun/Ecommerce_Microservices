using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Dtos;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Persistances;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Sellers.Api.Services;

public class ShopService(
    SellerDbContext dbContext,
    IEfUnitOfWork unitOfWork,
    IMapper mapper) : IShopService
{
    private readonly IGenericEfRepository<Shop, long> _shopRepository = unitOfWork.Repository<Shop, long>();

    public async Task<Result<PagedResult<ShopDto>>> GetAllShopsAsync(int pageNumber, int pageSize, string? searchTerm, string? status)
    {
        var query = dbContext.Shops.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(s => s.Name.ToLower().Contains(searchTerm.ToLower()) || s.Description.ToLower().Contains(searchTerm.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ShopStatus>(status, true, out var shopStatus))
        {
            query = query.Where(s => s.Status == shopStatus);
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(s => s.CreatedDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = mapper.Map<List<ShopDto>>(items);
        return Result<PagedResult<ShopDto>>.Success(new PagedResult<ShopDto>(dtos, totalCount, pageNumber, pageSize));
    }

    public async Task<Result<SellerProfileDto>> GetMySellerProfileAsync(long userId)
    {
        var kyc = await dbContext.SellerKycs.FirstOrDefaultAsync(k => k.UserId == userId);
        var shops = await dbContext.Shops.Where(s => s.OwnerUserId == userId).ToListAsync();

        var profile = new SellerProfileDto
        {
            KycStatus = kyc?.Status.ToString() ?? "None",
            RejectionReason = kyc?.RejectReason,
            Kyc = kyc != null ? mapper.Map<SellerKycDto>(kyc) : null,
            Shops = mapper.Map<List<ShopDto>>(shops)
        };

        return Result<SellerProfileDto>.Success(profile);
    }

    public async Task<Result<ShopDto>> GetShopByIdAsync(long id, long userId)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null)
            return Result<ShopDto>.Failure("Cửa hàng không tồn tại.");

        if (shop.OwnerUserId != userId)
            return Result<ShopDto>.Failure("Bạn không có quyền truy cập cửa hàng này.");

        var dto = mapper.Map<ShopDto>(shop);
        dto.FollowerCount = await dbContext.FollowedShops.CountAsync(f => f.ShopId == id);
        return Result<ShopDto>.Success(dto);
    }

    public async Task<Result<ShopDto>> GetPublicShopByIdAsync(long id)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null || shop.Status != ShopStatus.Active)
            return Result<ShopDto>.Failure("Cửa hàng không tồn tại hoặc đã ngưng hoạt động.");

        var dto = mapper.Map<ShopDto>(shop);
        dto.FollowerCount = await dbContext.FollowedShops.CountAsync(f => f.ShopId == id);
        return Result<ShopDto>.Success(dto);
    }

    public async Task<Result<List<ShopDto>>> GetPublicShopsByOwnerIdAsync(long ownerUserId)
    {
        var shops = await dbContext.Shops.Where(s => s.OwnerUserId == ownerUserId && s.Status == ShopStatus.Active).ToListAsync();
        return Result<List<ShopDto>>.Success(mapper.Map<List<ShopDto>>(shops));
    }

    public async Task<Result<ShopDto>> CreateShopAsync(long ownerUserId, string name, string description, string logoUrl)
    {
        var kyc = await dbContext.SellerKycs.FirstOrDefaultAsync(k => k.UserId == ownerUserId);
        if (kyc == null || kyc.Status != KycStatus.Verified)
        {
            return Result<ShopDto>.Failure("Tài khoản chưa hoàn thành xác thực danh tính KYC.");
        }

        var existingShop = await _shopRepository.FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower());
        if (existingShop != null)
        {
            return Result<ShopDto>.Failure("Tên cửa hàng đã tồn tại.");
        }

        var shop = new Shop(ownerUserId, name, description, logoUrl);

        _shopRepository.Add(shop);
        await unitOfWork.SaveChangesAsync();

        return Result<ShopDto>.Success(mapper.Map<ShopDto>(shop));
    }

    public async Task<Result<ShopDto>> UpdateShopAsync(long id, long ownerUserId, string name, string description, string? logoUrl, string recipientName, string phone, string addressLine, long provinceId, long districtId, long wardId)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null)
            return Result<ShopDto>.Failure("Cửa hàng không tồn tại.");

        if (shop.OwnerUserId != ownerUserId)
            return Result<ShopDto>.Failure("Bạn không có quyền chỉnh sửa cửa hàng này.");

        shop.Name = name;
        shop.Description = description;
        if (!string.IsNullOrEmpty(logoUrl)) shop.LogoUrl = logoUrl;

        shop.PickUpAddress = new PickUpAddress(recipientName, phone, addressLine, provinceId, districtId, wardId);
        shop.LastModifiedDate = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync();
        return Result<ShopDto>.Success(mapper.Map<ShopDto>(shop));
    }

    public async Task<Result> SuspendShopAsync(long id, long userId, bool isAdmin)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null)
            return Result.Failure("Cửa hàng không tồn tại.");

        if (!isAdmin && shop.OwnerUserId != userId)
            return Result.Failure("Bạn không có quyền thao tác trên cửa hàng này.");

        shop.Suspend();
        shop.LastModifiedDate = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result> ActivateShopAsync(long id, long userId, bool isAdmin)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null)
            return Result.Failure("Cửa hàng không tồn tại.");

        if (!isAdmin && shop.OwnerUserId != userId)
            return Result.Failure("Bạn không có quyền thao tác trên cửa hàng này.");

        shop.Activate();
        shop.LastModifiedDate = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result> BanShopAsync(long id)
    {
        var shop = await _shopRepository.GetByIdAsync(id);
        if (shop == null)
            return Result.Failure("Cửa hàng không tồn tại.");

        shop.Ban();
        shop.LastModifiedDate = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result<ValidateShopOwnerDto>> ValidateShopOwnerAsync(long shopId, long userId)
    {
        var shop = await _shopRepository.GetByIdAsync(shopId);
        if (shop == null)
            return Result<ValidateShopOwnerDto>.Failure("Cửa hàng không tồn tại.");

        return Result<ValidateShopOwnerDto>.Success(new ValidateShopOwnerDto
        {
            IsOwner = shop.OwnerUserId == userId,
            ShopName = shop.Name,
            IsActive = shop.Status == ShopStatus.Active
        });
    }

    public async Task<Result<List<ShopDto>>> GetShopsByIdsAsync(List<long> shopIds)
    {
        var shops = await dbContext.Shops.Where(s => shopIds.Contains(s.Id)).ToListAsync();
        return Result<List<ShopDto>>.Success(mapper.Map<List<ShopDto>>(shops));
    }

    public async Task<Result<ShopShippingInfoDto>> GetShopShippingInfoAsync(long shopId)
    {
        var shop = await _shopRepository.GetByIdAsync(shopId);
        if (shop == null)
            return Result<ShopShippingInfoDto>.Failure($"Không tìm thấy cửa hàng ID {shopId}");

        return Result<ShopShippingInfoDto>.Success(new ShopShippingInfoDto
        {
            ShopId = shop.Id,
            ShopName = shop.Name,
            Phone = shop.PickUpAddress?.Phone ?? string.Empty,
            AddressLine = shop.PickUpAddress?.AddressLine ?? string.Empty,
            WardId = shop.PickUpAddress?.WardId ?? 0,
            DistrictId = shop.PickUpAddress?.DistrictId ?? 0,
            ProvinceId = shop.PickUpAddress?.ProvinceId ?? 0,
            OwnerUserId = shop.OwnerUserId,
            RecipientName = shop.PickUpAddress?.RecipientName ?? string.Empty,
            LogoUrl = shop.LogoUrl ?? string.Empty
        });
    }

    public async Task<Result<List<ShopShippingInfoDto>>> GetShopsShippingInfoAsync(List<long> shopIds)
    {
        var shops = await dbContext.Shops.Where(s => shopIds.Contains(s.Id)).ToListAsync();
        var dtos = shops.Select(shop => new ShopShippingInfoDto
        {
            ShopId = shop.Id,
            ShopName = shop.Name,
            Phone = shop.PickUpAddress?.Phone ?? string.Empty,
            AddressLine = shop.PickUpAddress?.AddressLine ?? string.Empty,
            WardId = shop.PickUpAddress?.WardId ?? 0,
            DistrictId = shop.PickUpAddress?.DistrictId ?? 0,
            ProvinceId = shop.PickUpAddress?.ProvinceId ?? 0,
            OwnerUserId = shop.OwnerUserId,
            RecipientName = shop.PickUpAddress?.RecipientName ?? string.Empty,
            LogoUrl = shop.LogoUrl ?? string.Empty
        }).ToList();

        return Result<List<ShopShippingInfoDto>>.Success(dtos);
    }

    public async Task<Result<bool>> ToggleFollowShopAsync(long customerId, long shopId)
    {
        var shopExists = await dbContext.Shops.AnyAsync(s => s.Id == shopId);
        if (!shopExists)
        {
            return Result<bool>.Failure("Cửa hàng không tồn tại.");
        }

        var existingFollow = await dbContext.FollowedShops
            .FirstOrDefaultAsync(f => f.CustomerId == customerId && f.ShopId == shopId);

        if (existingFollow != null)
        {
            dbContext.FollowedShops.Remove(existingFollow);
            await dbContext.SaveChangesAsync();
            return Result<bool>.Success(false); // Un-followed
        }
        else
        {
            var follow = new FollowedShop(customerId, shopId);
            await dbContext.FollowedShops.AddAsync(follow);
            await dbContext.SaveChangesAsync();
            return Result<bool>.Success(true); // Followed
        }
    }

    public async Task<Result<List<ShopDto>>> GetFollowedShopsAsync(long customerId)
    {
        var followedShops = await dbContext.FollowedShops
            .AsNoTracking()
            .Where(f => f.CustomerId == customerId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                Shop = f.Shop,
                FollowerCount = f.Shop.Followers.Count()
            })
            .ToListAsync();

        if (!followedShops.Any())
        {
            return Result<List<ShopDto>>.Success([]);
        }

        var dtos = followedShops.Select(x =>
        {
            var dto = mapper.Map<ShopDto>(x.Shop);
            dto.FollowerCount = x.FollowerCount;
            return dto;
        }).ToList();

        return Result<List<ShopDto>>.Success(dtos);
    }

    public async Task<Result<bool>> CheckFollowStatusAsync(long customerId, long shopId)
    {
        if (customerId <= 0)
        {
            return Result<bool>.Success(false);
        }

        var isFollowing = await dbContext.FollowedShops
            .AnyAsync(f => f.CustomerId == customerId && f.ShopId == shopId);

        return Result<bool>.Success(isFollowing);
    }

    public async Task<Result<PagedResult<ShopFollowerDto>>> GetShopFollowersAsync(long shopId, int pageNumber, int pageSize, DateTime? fromDate = null)
    {
        var query = dbContext.FollowedShops.Where(f => f.ShopId == shopId);
        if (fromDate.HasValue)
        {
            query = query.Where(f => f.CreatedAt >= fromDate.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(f => f.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new ShopFollowerDto
            {
                Id = f.Id.ToString(),
                CustomerId = f.CustomerId,
                ShopId = f.ShopId,
                FollowedAt = f.CreatedAt
            })
            .ToListAsync();

        return Result<PagedResult<ShopFollowerDto>>.Success(new PagedResult<ShopFollowerDto>(items, totalCount, pageNumber, pageSize));
    }

    public async Task<Result<int>> GetShopFollowersCountAsync(long shopId)
    {
        var count = await dbContext.FollowedShops.CountAsync(f => f.ShopId == shopId);
        return Result<int>.Success(count);
    }
}
