using System;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;

public record CreateCategoryCommand(string Name, string Description, Guid? ParentId) : IRequest<Result<Guid>>;
