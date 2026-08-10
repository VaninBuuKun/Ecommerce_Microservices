using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Services;

public interface IAddressService
{
    Task<List<UserAddress>> GetAddressesByUserIdAsync(long userId);
    Task<UserAddress> CreateAddressAsync(long userId, CreateAddressDto dto);
    Task<bool> DeleteAddressAsync(long userId, Guid addressId);
    Task<bool> SetDefaultAddressAsync(long userId, Guid addressId);
}

public class CreateAddressDto
{
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class AddressService(AppDbContext dbContext) : IAddressService
{
    public async Task<List<UserAddress>> GetAddressesByUserIdAsync(long userId)
    {
        return await dbContext.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ToListAsync();
    }

    public async Task<UserAddress> CreateAddressAsync(long userId, CreateAddressDto dto)
    {
        // Kiểm tra xem đã có địa chỉ nào chưa
        bool isFirstAddress = !await dbContext.UserAddresses.AnyAsync(a => a.UserId == userId);
        bool setAsDefault = dto.IsDefault || isFirstAddress;

        if (setAsDefault)
        {
            // Reset các địa chỉ mặc định cũ
            var defaultAddresses = await dbContext.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();

            foreach (var addr in defaultAddresses)
            {
                addr.IsDefault = false;
            }
        }

        var newAddress = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RecipientName = dto.RecipientName,
            Phone = dto.Phone,
            ProvinceId = dto.ProvinceId,
            DistrictId = dto.DistrictId,
            WardId = dto.WardId,
            AddressLine = dto.AddressLine,
            IsDefault = setAsDefault
        };

        dbContext.UserAddresses.Add(newAddress);
        await dbContext.SaveChangesAsync();

        return newAddress;
    }

    public async Task<bool> DeleteAddressAsync(long userId, Guid addressId)
    {
        var address = await dbContext.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            return false;
        }

        dbContext.UserAddresses.Remove(address);
        await dbContext.SaveChangesAsync();

        // Tự động set địa chỉ khác làm mặc định nếu địa chỉ bị xóa đang là mặc định
        if (address.IsDefault)
        {
            var nextAddress = await dbContext.UserAddresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Id)
                .FirstOrDefaultAsync();

            if (nextAddress != null)
            {
                nextAddress.IsDefault = true;
                await dbContext.SaveChangesAsync();
            }
        }

        return true;
    }

    public async Task<bool> SetDefaultAddressAsync(long userId, Guid addressId)
    {
        var target = await dbContext.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);
        if (target == null)
        {
            return false;
        }

        var defaultAddresses = await dbContext.UserAddresses
            .Where(a => a.UserId == userId && a.IsDefault)
            .ToListAsync();

        foreach (var addr in defaultAddresses)
        {
            addr.IsDefault = false;
        }

        target.IsDefault = true;
        await dbContext.SaveChangesAsync();
        return true;
    }
}
