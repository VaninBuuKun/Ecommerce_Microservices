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
    Task<bool> DeleteAddressAsync(long userId, long addressId);
    Task<bool> SetDefaultAddressAsync(long userId, long addressId);
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
        bool isFirstAddress = !await dbContext.UserAddresses.AnyAsync(a => a.UserId == userId);
        bool setAsDefault = dto.IsDefault || isFirstAddress;

        if (setAsDefault)
        {
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

    public async Task<bool> DeleteAddressAsync(long userId, long addressId)
    {
        var address = await dbContext.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            return false;
        }

        dbContext.UserAddresses.Remove(address);
        await dbContext.SaveChangesAsync();

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

    public async Task<bool> SetDefaultAddressAsync(long userId, long addressId)
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
