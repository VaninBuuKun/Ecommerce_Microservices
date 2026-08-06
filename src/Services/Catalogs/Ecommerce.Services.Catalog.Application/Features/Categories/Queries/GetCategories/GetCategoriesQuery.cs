using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Queries.GetCategories;

public record GetCategoriesQuery : IQuery<List<CategoryDto>>, ICommand<List<CategoryDto>>;