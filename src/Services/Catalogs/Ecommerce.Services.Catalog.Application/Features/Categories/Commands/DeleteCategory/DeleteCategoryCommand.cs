using BuildingBlocks.Shared.Commons;
using MediatR;
using System;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(Guid Id) : IRequest<Result<bool>>;
