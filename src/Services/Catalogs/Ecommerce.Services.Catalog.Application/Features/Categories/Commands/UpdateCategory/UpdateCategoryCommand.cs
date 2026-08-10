using BuildingBlocks.Shared.Commons;
using MediatR;
using System;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(Guid Id, string Name, string Description, Guid? ParentId) : IRequest<Result<bool>>;
