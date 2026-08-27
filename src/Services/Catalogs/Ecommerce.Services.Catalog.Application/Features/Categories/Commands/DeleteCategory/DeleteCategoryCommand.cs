using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(long Id) : IRequest<Result<bool>>;
