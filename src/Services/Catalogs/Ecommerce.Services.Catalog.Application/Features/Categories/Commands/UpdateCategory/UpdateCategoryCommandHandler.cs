using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler(IEfUnitOfWork unitOfWork) : IRequestHandler<UpdateCategoryCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, long>();

        var category = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<bool>.Failure("Danh mục không tồn tại.");
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await categoryRepository.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parentExists == null)
            {
                return Result<bool>.Failure("Danh mục cha không tồn tại.");
            }
        }

        category.Update(request.Name, request.Description, request.IconUrl, request.ParentId);

        categoryRepository.Update(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
