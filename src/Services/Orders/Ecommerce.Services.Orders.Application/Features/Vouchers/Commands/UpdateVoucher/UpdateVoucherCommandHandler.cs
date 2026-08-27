using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.UpdateVoucher;

public class UpdateVoucherCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ILogger<UpdateVoucherCommandHandler> logger,
    IMapper mapper
) : CommandHandler<UpdateVoucherCommand, VoucherDto>
{
    private IGenericEfRepository<Voucher, long> VoucherRepo => unitOfWork.Repository<Voucher, long>();

    protected override async Task<Result<VoucherDto>> HandleCommandAsync(UpdateVoucherCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var voucher = await VoucherRepo.GetByIdAsync(command.VoucherId, cancellationToken);
            if (voucher is null)
            {
                return Result<VoucherDto>.Failure($"Voucher {command.VoucherId} not found.", EErrorCode.NotFound);
            }

            // Authorization: Admin có thể update mọi voucher; Seller chỉ update voucher của shop mình
            if (!command.IsAdmin)
            {
                if (voucher.Scope != VoucherScope.Shop || voucher.ShopId is null)
                {
                    return Result<VoucherDto>.Failure("You do not have permission to update this voucher.", EErrorCode.Forbidden);
                }

                var ownerValidation = await sellerService.ValidateShopOwnerAsync(voucher.ShopId.Value, command.UserId, cancellationToken);
                if (!ownerValidation.IsSuccess || !ownerValidation.Value)
                {
                    return Result<VoucherDto>.Failure("You do not own this shop's voucher.", EErrorCode.Forbidden);
                }
            }

            // Patch chỉ các field được truyền lên (partial update)
            var req = command.Request;

            if (req.Name is not null)
                voucher.Name = req.Name;

            if (req.DiscountValue.HasValue)
                voucher.DiscountValue = req.DiscountValue.Value;

            if (req.MinOrderValue.HasValue)
                voucher.MinOrderValue = req.MinOrderValue.Value;

            if (req.MaxUsageCount.HasValue)
                voucher.MaxUsageCount = req.MaxUsageCount.Value;

            if (req.MaxUsagePerUser.HasValue)
                voucher.MaxUsagePerUser = req.MaxUsagePerUser.Value;

            if (req.IsActive.HasValue)
                voucher.IsActive = req.IsActive.Value;

            if (req.MaxDiscountAmount.HasValue)
                voucher.MaxDiscountAmount = req.MaxDiscountAmount.Value;
            
            voucher.DiscountType = req.DiscountType; // DiscountType không nullable, luôn patch

            // Validate date nếu có thay đổi
            var effectiveStart = req.StartDate ?? voucher.StartDate;
            var effectiveEnd   = req.EndDate   ?? voucher.EndDate;

            if (effectiveStart >= effectiveEnd)
            {
                return Result<VoucherDto>.Failure("Start date must be before end date.", EErrorCode.Conflict);
            }

            if (req.StartDate.HasValue) voucher.StartDate = req.StartDate.Value;
            if (req.EndDate.HasValue)   voucher.EndDate   = req.EndDate.Value;

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Voucher {VoucherId} updated by User {UserId}", command.VoucherId, command.UserId);
            return Result<VoucherDto>.Success(mapper.Map<VoucherDto>(voucher));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating voucher {VoucherId}", command.VoucherId);
            return Result<VoucherDto>.Failure($"Error updating voucher: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}