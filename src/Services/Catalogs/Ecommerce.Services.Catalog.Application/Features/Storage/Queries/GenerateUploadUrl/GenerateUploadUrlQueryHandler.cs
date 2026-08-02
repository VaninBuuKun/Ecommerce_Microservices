using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Common.Interfaces;

namespace Ecommerce.Services.Catalog.Application.Features.Storage.Queries.GenerateUploadUrl;

public class GenerateUploadUrlQueryHandler(IStorageService storageService) 
    : QueryHandler<GenerateUploadUrlQuery, UploadUrlResponse>
{
    protected override Task<Result<UploadUrlResponse>> HandleQueryAsync(GenerateUploadUrlQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.FileName) || string.IsNullOrEmpty(request.ContentType))
        {
            return Task.FromResult(Result<UploadUrlResponse>.ValidationFailure("FileName and ContentType are required."));
        }

        var fileExtension = Path.GetExtension(request.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

        var uploadUrl = storageService.GeneratePresignedUrlForUpload(uniqueFileName, request.ContentType);
        var publicUrl = storageService.GetPublicUrl(uniqueFileName);

        return Task.FromResult(Result<UploadUrlResponse>.Success(new UploadUrlResponse(uploadUrl, publicUrl, uniqueFileName)));
    }
}
