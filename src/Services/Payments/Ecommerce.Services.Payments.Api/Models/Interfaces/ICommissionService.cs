using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface ICommissionService
{
    Task<Result<decimal>> GetPlatformCommissionRateAsync();
    Task<Result<decimal>> UpdatePlatformCommissionRateAsync(decimal newRate);
}
