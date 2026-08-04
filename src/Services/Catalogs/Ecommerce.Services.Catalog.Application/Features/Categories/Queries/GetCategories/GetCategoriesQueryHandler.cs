using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;
using Ecommerce.Services.Catalog.Domain;
using MapsterMapper;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Queries.GetCategories;

public class GetCategoriesQueryHandler(IEfUnitOfWork unitOfWork, IMapper mapper) : CommandHandler<GetCategoriesQuery, List<CategoryDto>>
{
    protected override async Task<Result<List<CategoryDto>>> HandleCommandAsync(GetCategoriesQuery command, CancellationToken cancellationToken)
    {
        try
        {
            var cateRepo = unitOfWork.Repository<Category, Guid>();
            
            var categories = await cateRepo.GetAllAsync(predicate: cat => cat.ParentId == null &&cat.IsActive == true, cancellationToken: cancellationToken);
            
            var response = mapper.Map<List<CategoryDto>>(categories);
            
            return Result<List<CategoryDto>>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<List<CategoryDto>>.Failure($"An error occurred while retrieving categories: {ex.Message}");
        }
    }
}