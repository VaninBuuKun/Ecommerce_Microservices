using System;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.BackgroundJobs;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Mapster;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusCommandHandler(
    IEfUnitOfWork unitOfWork,
    IBackgroundJobManager backgroundJobManager)
    : CommandHandler<UpdateSubOrderStatusCommand>
{
    private readonly IGenericEfRepository<SubOrder, long> _orderRepository = unitOfWork.Repository<SubOrder, long>();
    
    protected override async Task<Result> HandleCommandAsync(UpdateSubOrderStatusCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(command.SubOrderId, cancellationToken);

            if (order == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }
            
            order.UpdateSubOrderStatus(command.Status);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            // Khi đơn hàng chuyển sang Delivered, lên lịch Hangfire tự động hoàn tất sau 7 ngày
            if (command.Status == SubOrderStatus.Delivered)
            {
                backgroundJobManager.Schedule<IOrderJobService>(
                    x => x.AutoCompleteSubOrderAsync(order.Id),
                    TimeSpan.FromDays(7));
            }
            
            return Result.Success();
        }
        catch (Exception e)
        {
            return Result.Failure("Có lỗi xảy ra khi cập nhật trạng thái đơn hàng");
        }
    }
}