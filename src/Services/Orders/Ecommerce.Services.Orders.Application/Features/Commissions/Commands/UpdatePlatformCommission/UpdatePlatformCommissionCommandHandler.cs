using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Commissions.Commands.UpdatePlatformCommission;

public class UpdatePlatformCommissionCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdatePlatformCommissionCommandHandler> logger) : CommandHandler<UpdatePlatformCommissionCommand, decimal>
{
    protected override async Task<Result<decimal>> HandleCommandAsync(UpdatePlatformCommissionCommand command, CancellationToken cancellationToken)
    {
        if (command.RatePercentage < 0 || command.RatePercentage > 100)
        {
            return Result<decimal>.ValidationFailure("Tỷ lệ chiết khấu phải nằm trong khoảng từ 0% đến 100%.");
        }

        var configRepo = unitOfWork.Repository<PlatformCommissionConfig, long>();
        var config = await configRepo.FirstOrDefaultAsync(c => true, null, cancellationToken);

        if (config == null)
        {
            config = new PlatformCommissionConfig
            {
                RatePercentage = command.RatePercentage,
                UpdatedByUserId = command.UpdatedByUserId
            };
            configRepo.Add(config);
        }
        else
        {
            config.RatePercentage = command.RatePercentage;
            config.UpdatedByUserId = command.UpdatedByUserId;
            config.LastModifiedDate = DateTimeOffset.UtcNow;
            configRepo.Update(config);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Updated Platform Commission Rate in Orders Service to {NewRate}% by User {UserId}", command.RatePercentage, command.UpdatedByUserId);

        return Result<decimal>.Success(command.RatePercentage);
    }
}
