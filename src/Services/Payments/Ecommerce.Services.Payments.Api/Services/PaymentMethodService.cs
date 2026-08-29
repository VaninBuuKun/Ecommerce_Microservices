using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MapsterMapper;

namespace Ecommerce.Services.Payments.Api.Services;

public class PaymentMethodService(IEfUnitOfWork unitOfWork, IMapper mapper) : IPaymentMethodService
{
    private readonly IGenericEfRepository<PaymentMethod, long> _paymentMethodRepository = unitOfWork.Repository<PaymentMethod, long>();
    
    public async Task<Result<PaymentMethod>> CreateNewPaymentMethod(CreatePaymentMethodRequest paymentMethod)
    {
        var existingMethod = await _paymentMethodRepository.FirstOrDefaultAsync(pm => pm.ProviderName == paymentMethod.ProviderName);

        if (existingMethod != null)
        {
            return Result<PaymentMethod>.Failure("Payment method already exists.", EErrorCode.RecordAlreadyExists);
        }
        
        var newMethod = mapper.Map<PaymentMethod>(paymentMethod);
        _paymentMethodRepository.Add(newMethod);
        
        await unitOfWork.SaveChangesAsync();

        return Result<PaymentMethod>.Success(newMethod);
    }

    public async Task<Result<List<PaymentMethod>>> GetPaymentMethods()
    {
        var methods = await _paymentMethodRepository.GetAllAsync();
        return Result<List<PaymentMethod>>.Success(methods);
    }

    public async Task<Result<PaymentMethod>> GetPaymentMethodById(long id)
    {
        var method = await _paymentMethodRepository.GetByIdAsync(id);
        if (method == null)
        {
            return Result<PaymentMethod>.ValidationFailure("Payment method not found.");
        }
        return Result<PaymentMethod>.Success(method);
    }
}
