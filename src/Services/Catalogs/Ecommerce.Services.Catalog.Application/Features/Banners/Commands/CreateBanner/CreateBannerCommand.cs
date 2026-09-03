using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.CreateBanner;

public record CreateBannerCommand(CreateBannerRequest Request) : IRequest<Result<long>>;
