using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;
using Ecommerce.Services.Catalog.Domain;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Queries.GetCategories;

public class GetCategoriesQueryHandler(IEfUnitOfWork unitOfWork, ICacheService cacheService) : CommandHandler<GetCategoriesQuery, List<CategoryDto>>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";

    protected override async Task<Result<List<CategoryDto>>> HandleCommandAsync(GetCategoriesQuery command, CancellationToken cancellationToken)
    {
        try
        {
            var cached = await cacheService.GetAsync<List<CategoryDto>>(CategoryTreeCacheKey, cancellationToken);
            if (cached != null && cached.Count > 0)
            {
                return Result<List<CategoryDto>>.Success(cached);
            }

            var cateRepo = unitOfWork.Repository<Category, long>();

            // Lấy tất cả danh mục đang hoạt động và sắp xếp cố định 100% theo CreatedDate rồi đến Id
            var allCategories = await cateRepo.GetAllAsync(c => c.IsActive, cancellationToken: cancellationToken);
            
            var sortedCategories = allCategories
                .OrderBy(c => c.CreatedDate)
                .ThenBy(c => c.Id)
                .ToList();

            // Nhóm theo ParentId để dựng cây danh mục n-cấp
            var lookup = sortedCategories.ToLookup(c => c.ParentId);

            CategoryDto MapNode(Category c) => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ParentId = c.ParentId,
                IconUrl = c.IconUrl,
                SubCategories = lookup[c.Id]
                    .OrderBy(sub => sub.CreatedDate)
                    .ThenBy(sub => sub.Id)
                    .Select(MapNode)
                    .ToList()
            };

            // Root categories có ParentId == null
            var response = lookup[null]
                .OrderBy(root => root.CreatedDate)
                .ThenBy(root => root.Id)
                .Select(MapNode)
                .ToList();

            await cacheService.SetAsync(CategoryTreeCacheKey, response, TimeSpan.FromHours(2), cancellationToken);

            return Result<List<CategoryDto>>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<List<CategoryDto>>.Failure($"An error occurred while retrieving categories: {ex.Message}");
        }
    }
}