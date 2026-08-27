using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;
using Ecommerce.Services.Catalog.Domain;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Queries.GetCategories;

public class GetCategoriesQueryHandler(IEfUnitOfWork unitOfWork) : CommandHandler<GetCategoriesQuery, List<CategoryDto>>
{
    protected override async Task<Result<List<CategoryDto>>> HandleCommandAsync(GetCategoriesQuery command, CancellationToken cancellationToken)
    {
        try
        {
            var cateRepo = unitOfWork.Repository<Category, long>();

            var categories = await cateRepo.GetAllAsync(c => c.IsActive && c.ParentId == null, cancellationToken: cancellationToken);

            var response = MapToDtoList(categories);

            return Result<List<CategoryDto>>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<List<CategoryDto>>.Failure($"An error occurred while retrieving categories: {ex.Message}");
        }
    }

    private static List<CategoryDto> MapToDtoList(IEnumerable<Category> categories)
    {
        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ParentId = c.ParentId,
            IconUrl = c.IconUrl,
            SubCategories = MapToDtoList(c.SubCategories ?? new List<Category>())
        }).ToList();
    }
}