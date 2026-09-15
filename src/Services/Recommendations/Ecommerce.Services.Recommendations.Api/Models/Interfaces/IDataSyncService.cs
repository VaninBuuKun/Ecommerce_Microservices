using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Recommendations.Api.Models.Interfaces;

public interface IDataSyncService
{
    Task<(int categoriesSynced, int productsSynced)> SyncFromCatalogAsync(CancellationToken cancellationToken = default);
}
