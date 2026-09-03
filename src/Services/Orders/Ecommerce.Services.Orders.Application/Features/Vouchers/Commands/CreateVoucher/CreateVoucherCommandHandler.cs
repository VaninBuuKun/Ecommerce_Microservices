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
            var existsVoucher = await voucherRepo.AnyAsync(v => v.Code == command.voucherRequest.Code, cancellationToken);
            if (existsVoucher)
            {
                return Result<VoucherDto>.Failure($"Voucher với mã '{command.voucherRequest.Code}' đã tồn tại.", EErrorCode.Conflict);
            }
            
            var voucher = mapper.Map<Voucher>(command.voucherRequest);
            
            if (command.IsAdmin)
            {
                voucher.Scope = VoucherScope.Platform;
                voucher.ShopId = null;
            }
            else
            {
                voucher.Scope = VoucherScope.Shop;
                voucher.ShopId = command.voucherRequest.ShopId!.Value;
            }

            voucher.IsActive = command.voucherRequest.IsActive;
            voucher.MaxUsagePerUser = command.voucherRequest.MaxUsagePerUser > 0 ? command.voucherRequest.MaxUsagePerUser : 1;
            voucher.CreatedByUserId = command.UserId;
            
            voucherRepo.Add(voucher);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Voucher '{Code}' ({Scope}) created successfully by User {UserId}", voucher.Code, voucher.Scope, command.UserId);
            return Result<VoucherDto>.Success(mapper.Map<VoucherDto>(voucher));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating voucher");
            return Result<VoucherDto>.Failure($"Error creating voucher: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}