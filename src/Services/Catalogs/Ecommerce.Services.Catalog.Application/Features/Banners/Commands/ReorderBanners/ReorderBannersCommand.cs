using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ReorderBanners;

public record ReorderBannersCommand(List<long> BannerIds) : IRequest<Result>;
