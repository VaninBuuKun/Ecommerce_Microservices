using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;

public record BannerDto(
    long Id,
    string Title,
    string? Subtitle,
    string? Badge,
    string ImageUrl,
    string ButtonText,
    string TargetUrl,
    string ThemeGradient,
    int DisplayOrder,
    bool IsActive,
    DateTimeOffset CreatedDate
);

public record CreateBannerRequest(
    string Title,
    string? Subtitle,
    string? Badge,
    string ImageUrl,
    string ButtonText,
    string TargetUrl,
    string ThemeGradient
);

public record UpdateBannerRequest(
    string Title,
    string? Subtitle,
    string? Badge,
    string ImageUrl,
    string ButtonText,
    string TargetUrl,
    string ThemeGradient
);

public record ToggleBannerStatusRequest(
    int? CustomDisplayOrder = null
);

public record ReorderBannersRequest(
    List<long> BannerIds
);
