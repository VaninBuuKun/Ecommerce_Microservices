using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService, IEventPublisher eventPublisher) : IRequestHandler<DeleteCategoryCommand, Result<bool>>
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

        try
        {
            var allCategories = await categoryRepository.GetAllAsync(null, null, cancellationToken);
            await eventPublisher.PublishAsync(new CategoryTreeSyncEvent
            {
                Categories = allCategories.Select(c => new CategorySnapshotItem
                {
                    CategoryId = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    Level = c.ParentId == null ? 1 : 2
                }).ToList()
            }, cancellationToken);
        }
        catch
        {
            // Logging can be suppressed
        }

        return Result<bool>.Success(true);
    }
}
