using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MapsterMapper;

namespace Ecommerce.Services.Payments.Api.Services;

public class PaymentService(IEfUnitOfWork unitOfWork, IMapper mapper) : IPaymentService
{
    private readonly IGenericEfRepository<PaymentMethod, long> _paymentMethodRepository = unitOfWork.Repository<PaymentMethod, long>();

    public async Task<Result<CreatePaymentResult>> ProcessPayment(CreatePaymentRequest paymentRequest)
    {
        var existingMethod = await _paymentMethodRepository.FirstOrDefaultAsync(
            predicate: pm => pm.ProviderName == paymentRequest.MethodProvider);
        if (existingMethod == null)
        {
            return Result<CreatePaymentResult>.Success(new CreatePaymentResult()
            {
                Success = false,
                ErrorMessage = $"Payment method '{paymentRequest.MethodProvider}' not found."
            });
        }

        IPaymentGateway? gateway = existingMethod.ProviderName switch
        {
            "cod" => new CODPaymentGateway(unitOfWork),
            _ => null
        };

        if (gateway == null)
        {
            return Result<CreatePaymentResult>.Success(new CreatePaymentResult()
            {
                Success = false,
                ErrorMessage = $"Payment gateway for provider '{paymentRequest.MethodProvider}' not implemented."
            });
        }
        
        var input = mapper.Map<CreatePaymentInput>(paymentRequest);
        input.MethodId = existingMethod.Id;

        var paymentResult = await gateway.CreatePaymentAsync(input);
        return Result<CreatePaymentResult>.Success(paymentResult);
    }
}