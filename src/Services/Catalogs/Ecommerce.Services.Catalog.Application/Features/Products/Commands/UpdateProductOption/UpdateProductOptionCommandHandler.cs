using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductOption;
public class UpdateProductOptionCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateProductOptionCommandHandler> logger
) : CommandHandler<UpdateProductOptionCommand, bool>
{
    private readonly IGenericEfRepository<ProductOption, Guid> _optionRepository = unitOfWork.Repository<ProductOption, Guid>();

    protected override async Task<Result<bool>> HandleCommandAsync(UpdateProductOptionCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var option = await _optionRepository.GetByIdAsync(command.OptionId, cancellationToken);
            if (option == null)
            {
                return Result<bool>.Failure("Option Not Found", EErrorCode.NotFound);
            }

            option.Update(command.Name, option.SortOrder);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while updating option {OptionId}", command.OptionId);
            return Result<bool>.ValidationFailure(ex.Message);
        }
    }
}
