using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;

namespace Ecommerce.Services.Payments.Api.Services;

public class CODPaymentGateway(IEfUnitOfWork unitOfWork) : IPaymentGateway
{
    public string GatewayName => "cod";
    
    private readonly IGenericEfRepository<Payment, Guid> _paymentRepository = unitOfWork.Repository<Payment, Guid>();
    private IPaymentGateway _paymentGatewayImplementation;

    public async Task<CreatePaymentResult> CreatePaymentAsync(CreatePaymentInput input, CancellationToken ct = default)
    {
        var payment = new Payment
        {
            Amount = input.Amount,
            TargetId = input.TargetId,
            Status = PaymentStatus.Pending,
            Type = input.PaymentType,
            MethodId = input.MethodId,
        };

        unitOfWork.Repository<Payment, Guid>().Add(payment);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreatePaymentResult()
        {
            Success = true
        };
    }

    public Task<bool> VerifyCallbackAsync(Dictionary<string, string> callbackParams)
    {
        return Task.FromResult(true);
    }
    
}