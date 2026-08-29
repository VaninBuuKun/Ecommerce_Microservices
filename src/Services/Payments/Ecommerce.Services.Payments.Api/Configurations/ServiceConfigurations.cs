using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Persistances;
using Ecommerce.Services.Payments.Api.Services;

namespace Ecommerce.Services.Payments.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IPaymentMethodService, PaymentMethodService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<IWithdrawalService, WithdrawalService>();
        services.AddScoped<ICommissionService, CommissionService>();
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<PaymentDbContext>>();
        services.AddScoped<PaymentGatewayFactory>();
        services.AddScoped<IPaymentGateway, MomoPaymentGateway>();
        services.AddScoped<IPaymentGateway, CODPaymentGateway>();
        services.AddScoped<IPaymentGateway, VNPayPaymentGateway>();
    }
}
