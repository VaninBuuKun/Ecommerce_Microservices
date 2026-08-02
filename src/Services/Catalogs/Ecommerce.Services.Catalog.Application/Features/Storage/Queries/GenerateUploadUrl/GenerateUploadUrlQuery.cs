using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Storage.Queries.GenerateUploadUrl;

public record GenerateUploadUrlQuery(string FileName, string ContentType) : IQuery<UploadUrlResponse>;

public record UploadUrlResponse(string UploadUrl, string PublicUrl, string UniqueFileName);
