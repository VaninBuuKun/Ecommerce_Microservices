using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ToggleBannerStatus;

public record ToggleBannerStatusCommand(long Id, int? CustomDisplayOrder = null) : IRequest<Result>;
