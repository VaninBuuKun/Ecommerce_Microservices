using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler(IEfUnitOfWork unitOfWork) : IRequestHandler<UpdateCategoryCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, Guid>();
        var category = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<bool>.Failure("Danh mục không tồn tại.", EErrorCode.NotFound);
        }

        if (request.ParentId.HasValue)
        {
            if (request.ParentId.Value == category.Id)
            {
                return Result<bool>.Failure("Danh mục cha không được trùng với chính nó.");
            }

            var parent = await categoryRepository.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
            {
                return Result<bool>.Failure("Danh mục cha không tồn tại.", EErrorCode.NotFound);
            }

            if (parent.ParentId.HasValue)
            {
                return Result<bool>.Failure("Hệ thống chỉ hỗ trợ phân cấp tối đa 2 tầng danh mục.");
            }
        }

        category.Update(request.Name, request.Description, request.ParentId);
        categoryRepository.Update(category);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
