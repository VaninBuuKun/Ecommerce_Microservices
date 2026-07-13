using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Mapster;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusCommandHandler(IEfUnitOfWork unitOfWork) : CommandHandler<UpdateOrderStatusCommand>
{
    private readonly IGenericEfRepository<Order, Guid> _orderRepository = unitOfWork.Repository<Order, Guid>();
    
    protected override async Task<Result> HandleCommandAsync(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken);

            if (order == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }
            
            order.UpdateOrderStatus(command.Status);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            return Result.Success();
        }
        catch (Exception e)
        {
            return Result.Failure("Có lỗi xảy ra khi cập nhật trạng thái đơn hàng");
        }
    }
}