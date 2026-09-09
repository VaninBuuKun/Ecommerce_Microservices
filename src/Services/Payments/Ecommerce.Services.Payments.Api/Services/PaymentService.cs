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

        if (existingMethod.MinAmount.HasValue && existingMethod.MinAmount.Value > 0 && paymentRequest.Amount < existingMethod.MinAmount.Value)
        {
            return Result<CreatePaymentResult>.Success(new CreatePaymentResult
            {
                Success = false,
                ErrorMessage = $"Phương thức thanh toán '{existingMethod.Title}' chỉ áp dụng cho đơn hàng từ {existingMethod.MinAmount.Value:N0} ₫ trở lên."
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
            OrderId = paymentRequest.OrderId,
            Status = PaymentStatus.UnPaid,
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

    public async Task<Result<Payment>> GetPaymentByOrderIdAsync(long orderId)
    {
        var payment = await _paymentRepository.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment == null)
        {
            return Result<Payment>.Failure("Payment not found for the specified order.");
        }

        return Result<Payment>.Success(payment);
    }
}
