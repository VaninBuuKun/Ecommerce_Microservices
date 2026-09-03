using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.UpdateBanner;

public record UpdateBannerCommand(long Id, UpdateBannerRequest Request) : IRequest<Result>;
