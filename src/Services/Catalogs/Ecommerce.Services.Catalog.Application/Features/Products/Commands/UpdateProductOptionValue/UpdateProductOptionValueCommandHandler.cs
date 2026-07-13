using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductOptionValue;

public class UpdateProductOptionValueCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateProductOptionValueCommandHandler> logger
) : CommandHandler<UpdateProductOptionValueCommand, bool>
{
    private readonly IGenericEfRepository<ProductOptionValue, Guid> _optionValueRepository = unitOfWork.Repository<ProductOptionValue, Guid>();

    protected override async Task<Result<bool>> HandleCommandAsync(UpdateProductOptionValueCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var optionValue = await _optionValueRepository.GetByIdAsync(command.OptionValueId, cancellationToken);
            if (optionValue == null)
            {
                return Result<bool>.Failure("Option Value Not Found", EErrorCode.NotFound);
            }

            optionValue.Update(command.Value, optionValue.SortOrder);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while updating option value {OptionValueId}", command.OptionValueId);
            return Result<bool>.ValidationFailure(ex.Message);
        }
    }
}
