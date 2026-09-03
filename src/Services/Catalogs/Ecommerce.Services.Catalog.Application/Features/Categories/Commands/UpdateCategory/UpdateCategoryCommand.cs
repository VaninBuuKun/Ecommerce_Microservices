using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(long Id, string Name, string? Description, string? IconUrl, long? ParentId) : IRequest<Result<bool>>;
