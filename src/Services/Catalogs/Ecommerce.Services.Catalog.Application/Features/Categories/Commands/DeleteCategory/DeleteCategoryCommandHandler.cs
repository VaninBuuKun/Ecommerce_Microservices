using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService) : IRequestHandler<DeleteCategoryCommand, Result<bool>>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";

    public async Task<Result<bool>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, long>();

        var category = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<bool>.Failure("Danh mục không tồn tại.");
        }

        categoryRepository.Delete(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveAsync(CategoryTreeCacheKey, cancellationToken);

        return Result<bool>.Success(true);
    }
}
