using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.DeleteVoucher;

public class DeleteVoucherCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ILogger<DeleteVoucherCommandHandler> logger
) : CommandHandler<DeleteVoucherCommand, bool>
{
    private IGenericEfRepository<Voucher, long> voucherRepo => unitOfWork.Repository<Voucher, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteVoucherCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var voucher = await voucherRepo.GetByIdAsync(command.VoucherId, cancellationToken);
            if (voucher is null)
            {
                return Result<bool>.Failure($"Không tìm thấy voucher #{command.VoucherId}.", EErrorCode.NotFound);
            }

            // Phân quyền xóa:
            // Admin: Chỉ xóa voucher Platform (không can thiệp xóa voucher Shop của người bán)
            // Seller: Chỉ xóa voucher Shop của chính shop mình
            if (command.IsAdmin)
            {
                if (voucher.Scope != VoucherScope.Platform)
                {
                    return Result<bool>.Failure("Quản trị viên chỉ có quyền xóa/ngừng kích hoạt Voucher toàn sàn (Platform).", EErrorCode.Forbidden);
                }
            }
            else
            {
                if (voucher.Scope != VoucherScope.Shop || !voucher.ShopId.HasValue)
                {
                    return Result<bool>.Failure("Bạn không có quyền xóa voucher này.", EErrorCode.Forbidden);
                }

                var ownerValidation = await sellerService.ValidateShopOwnerAsync(voucher.ShopId.Value, command.UserId, cancellationToken);
                if (!ownerValidation.IsSuccess || !ownerValidation.Value)
                {
                    return Result<bool>.Failure("Bạn không phải chủ sở hữu gian hàng của voucher này.", EErrorCode.Forbidden);
                }
            }

            // Xóa voucher khỏi hệ thống (hoặc soft-delete IsActive = false nếu đã có lượt dùng)
            if (voucher.UsageCount > 0)
            {
                voucher.IsActive = false;
                logger.LogInformation("Voucher #{VoucherId} has {Count} usages. Deactivated instead of hard delete.", command.VoucherId, voucher.UsageCount);
            }
            else
            {
                voucherRepo.Delete(voucher);
                logger.LogInformation("Voucher #{VoucherId} hard deleted successfully by User {UserId}", command.VoucherId, command.UserId);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting voucher #{VoucherId}", command.VoucherId);
            return Result<bool>.Failure($"Lỗi khi xóa voucher: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
