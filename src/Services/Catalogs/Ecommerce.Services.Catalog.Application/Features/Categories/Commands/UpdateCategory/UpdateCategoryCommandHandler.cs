using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService, IEventPublisher eventPublisher) : IRequestHandler<UpdateCategoryCommand, Result<bool>>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";

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
