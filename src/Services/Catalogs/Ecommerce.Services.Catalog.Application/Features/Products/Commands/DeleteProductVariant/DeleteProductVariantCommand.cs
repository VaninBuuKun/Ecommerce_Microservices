using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;

public record DeleteProductVariantCommand(Guid VariantId) : ICommand<bool>;

