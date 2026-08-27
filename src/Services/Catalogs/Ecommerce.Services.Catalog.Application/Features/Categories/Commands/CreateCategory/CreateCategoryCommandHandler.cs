using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler(IEfUnitOfWork unitOfWork) : IRequestHandler<CreateCategoryCommand, Result<long>>
{
    public async Task<Result<long>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, long>();

        if (request.ParentId.HasValue)
        {
            var parentExists = await categoryRepository.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parentExists == null)
            {
                return Result<long>.Failure("Danh mục cha không tồn tại.");
            }
        }

        var category = new Category(request.Name, request.Description, request.IconUrl, request.ParentId);

        categoryRepository.Add(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(category.Id);
    }
}
