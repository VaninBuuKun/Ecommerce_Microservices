using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.CreateVoucher;

public class CreateVoucherCommandHandler(IEfUnitOfWork unitOfWork, ILogger<CreateVoucherCommandHandler> logger, IMapper mapper) : CommandHandler<CreateVoucherCommand,  VoucherDto>
{
    private IGenericEfRepository<Voucher, long> voucherRepo => unitOfWork.Repository<Voucher, long>();
    protected override async Task<Result<VoucherDto>> HandleCommandAsync(CreateVoucherCommand command, CancellationToken cancellationToken)
    {
        try
        {
            if (command.voucherRequest.EndDate < DateTimeOffset.UtcNow)
            {
                return Result<VoucherDto>.Failure("End date must be in the future.", EErrorCode.Conflict);
            }
            
            if (command.voucherRequest.StartDate >= command.voucherRequest.EndDate)
            {
                return Result<VoucherDto>.Failure("Start date must be before end date.", EErrorCode.Conflict);
            }
            
            var existsVoucher = await voucherRepo.AnyAsync(v => v.Code == command.voucherRequest.Code, cancellationToken);

            if (existsVoucher)
            {
                return Result<VoucherDto>.Failure($"Voucher with code {command.voucherRequest.Code} already exists.", EErrorCode.Conflict);
            }
            
            var voucher = mapper.Map<Voucher>(command.voucherRequest);
            voucher.Scope = command.IsAdmin ? VoucherScope.Platform : VoucherScope.Shop;
            voucher.CreatedByUserId = command.UserId;
            
            voucherRepo.Add(voucher);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<VoucherDto>.Success(mapper.Map<VoucherDto>(voucher));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating voucher");
            return Result<VoucherDto>.Failure($"Error creating voucher: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}