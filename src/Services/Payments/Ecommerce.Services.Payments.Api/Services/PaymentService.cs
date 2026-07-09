using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;

namespace Ecommerce.Services.Payments.Api.Services;

public class PaymentService(IEfUnitOfWork unitOfWork, PaymentGatewayFactory factory) : IPaymentService
{
    private readonly IGenericEfRepository<PaymentMethod, long> _paymentMethodRepository = unitOfWork.Repository<PaymentMethod, long>();
    private readonly IGenericEfRepository<Payment, Guid> _paymentRepository = unitOfWork.Repository<Payment, Guid>();

    public async Task<Result<CreatePaymentResult>> ProcessPayment(CreatePaymentRequest paymentRequest)
    {
        // 1. Kiểm tra phương thức thanh toán có tồn tại không
        var existingMethod = await _paymentMethodRepository.FirstOrDefaultAsync(
            predicate: pm => pm.ProviderName == paymentRequest.MethodProvider);
            
        if (existingMethod == null || !existingMethod.IsActive)
        {
            return Result<CreatePaymentResult>.Success(new CreatePaymentResult
            {
                Success = false,
                ErrorMessage = $"Payment method '{paymentRequest.MethodProvider}' is not available."
            });
        }
        
        var gateway = factory.GetPaymentGateway(paymentRequest.MethodProvider);
        if (gateway == null)
        {
            return Result<CreatePaymentResult>.Success(new CreatePaymentResult
            {
                Success = false,
                ErrorMessage = $"Payment gateway for '{paymentRequest.MethodProvider}' is not supported."
            });
        }
        
        var payment = new Payment
        {
            Amount = paymentRequest.Amount,
            TargetId = paymentRequest.TargetId,
            Status = PaymentStatus.Pending,
            Type = paymentRequest.PaymentType,
            MethodId = existingMethod.Id,
        };

        _paymentRepository.Add(payment);
        await unitOfWork.SaveChangesAsync();
        
        var paymentResult = await gateway.CreatePaymentAsync(payment);
        
        if (paymentResult.Success)
        {
            payment.PaymentUrl = paymentResult.PaymentUrl;
            await unitOfWork.SaveChangesAsync();
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            payment.ErrorMessage = paymentResult.ErrorMessage;
            await unitOfWork.SaveChangesAsync();
        }

        return Result<CreatePaymentResult>.Success(paymentResult);
    }
}