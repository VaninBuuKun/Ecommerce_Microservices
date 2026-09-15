using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService, IEventPublisher eventPublisher) : IRequestHandler<CreateCategoryCommand, Result<long>>
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
            // Logging can be ignored or suppressed
        }

        return Result<long>.Success(category.Id);
    }
}
