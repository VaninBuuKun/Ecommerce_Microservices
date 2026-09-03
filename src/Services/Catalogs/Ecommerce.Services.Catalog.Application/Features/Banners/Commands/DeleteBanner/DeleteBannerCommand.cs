using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.DeleteBanner;

public record DeleteBannerCommand(long Id) : IRequest<Result>;
