using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService) : IRequestHandler<CreateCategoryCommand, Result<long>>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";

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
        await cacheService.RemoveAsync(CategoryTreeCacheKey, cancellationToken);

        return Result<long>.Success(category.Id);
    }
}
