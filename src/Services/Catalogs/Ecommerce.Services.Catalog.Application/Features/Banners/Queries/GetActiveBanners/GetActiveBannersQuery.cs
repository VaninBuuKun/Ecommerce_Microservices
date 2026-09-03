using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Queries.GetActiveBanners;

public record GetActiveBannersQuery : IRequest<Result<List<BannerDto>>>;
