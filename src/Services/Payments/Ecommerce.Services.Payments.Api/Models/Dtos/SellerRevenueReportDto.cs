using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public record SellerRevenueReportDto(
    decimal TotalRevenue,
    decimal AvailableBalance,
    decimal FrozenBalance,
    int TotalCompletedOrders,
    List<DailyRevenueDto> DailyRevenues
);

public record DailyRevenueDto(
    string Date,
    decimal Revenue,
    int OrderCount
);
