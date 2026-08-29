using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Persistances;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Payments.Api.Services;

public class CommissionService(
    PaymentDbContext dbContext,
    ILogger<CommissionService> logger) : ICommissionService
{
    private const decimal DefaultCommissionRate = 5.0m;

    public async Task<Result<decimal>> GetPlatformCommissionRateAsync()
    {
        var config = await dbContext.PlatformCommissionConfigs.FirstOrDefaultAsync();
        return Result<decimal>.Success(config?.RatePercentage ?? DefaultCommissionRate);
    }

    public async Task<Result<decimal>> UpdatePlatformCommissionRateAsync(decimal newRate)
    {
        if (newRate < 0 || newRate > 100)
        {
            return Result<decimal>.ValidationFailure("Tỷ lệ chiết khấu phải nằm trong khoảng từ 0% đến 100%.");
        }

        var config = await dbContext.PlatformCommissionConfigs.FirstOrDefaultAsync();
        if (config == null)
        {
            config = new PlatformCommissionConfig
            {
                RatePercentage = newRate
            };
            dbContext.PlatformCommissionConfigs.Add(config);
        }
        else
        {
            config.RatePercentage = newRate;
            config.LastModifiedDate = DateTimeOffset.UtcNow;
            dbContext.PlatformCommissionConfigs.Update(config);
        }

        await dbContext.SaveChangesAsync();
        logger.LogInformation("Updated Platform Commission Rate to {NewRate}%", newRate);

        return Result<decimal>.Success(newRate);
    }
}
