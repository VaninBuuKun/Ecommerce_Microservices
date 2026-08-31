using System;
using BuildingBlocks.Grpc.Interceptors;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Grpc.Core;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Grpc.Extensions;

public static class GrpcExceptionExtensions
{
    /// <summary>
    /// Đăng ký gRPC Server tích hợp sẵn Global Server Exception Interceptor
    /// </summary>
    public static IServiceCollection AddBuildingBlocksGrpc(this IServiceCollection services)
    {
        services.AddGrpc(options =>
        {
            options.Interceptors.Add<GrpcGlobalServerExceptionInterceptor>();
        });
        return services;
    }

    // 1. Hàm ánh xạ mã lỗi EErrorCode sang gRPC StatusCode
    private static StatusCode MapToGrpcStatusCode(this EErrorCode errorCode)
    {
        return errorCode switch
        {
            EErrorCode.Success => StatusCode.OK,
            EErrorCode.InvalidArgument => StatusCode.InvalidArgument,
            EErrorCode.Unauthorized => StatusCode.Unauthenticated,
            EErrorCode.Forbidden => StatusCode.PermissionDenied,
            EErrorCode.NotFound => StatusCode.NotFound,
            EErrorCode.ValidationErrors => StatusCode.FailedPrecondition,
            _ => StatusCode.Internal
        };
    }
    
    private static EErrorCode ToEErrorCode(this StatusCode statusCode)
    {
        return statusCode switch
        {
            StatusCode.OK => EErrorCode.Success,
            StatusCode.InvalidArgument => EErrorCode.InvalidArgument,
            StatusCode.Unauthenticated => EErrorCode.Unauthorized,
            StatusCode.PermissionDenied => EErrorCode.Forbidden,
            StatusCode.NotFound => EErrorCode.NotFound,
            StatusCode.FailedPrecondition => EErrorCode.ValidationErrors,
            _ => EErrorCode.InternalServerError
        };
    }

    public static RpcException ToRpcException<T>(this Result<T> result)
    {
        var grpcStatusCode = result.ErrorCode.MapToGrpcStatusCode();
        var message = string.IsNullOrWhiteSpace(result.Message) ? "Thao tác gRPC không thành công" : result.Message;
        return new RpcException(new Status(grpcStatusCode, message));
    }

    public static RpcException ToRpcException(this Result result)
    {
        var grpcStatusCode = result.ErrorCode.MapToGrpcStatusCode();
        var message = string.IsNullOrWhiteSpace(result.Message) ? "Thao tác gRPC không thành công" : result.Message;
        return new RpcException(new Status(grpcStatusCode, message));
    }
    
    private static string NormalizeGrpcErrorMessage(string? detail)
    {
        if (string.IsNullOrWhiteSpace(detail) || detail.Contains("Exception was thrown by handler", StringComparison.OrdinalIgnoreCase))
        {
            return "Dịch vụ liên kết tạm thời không phản hồi hoặc gặp sự cố xử lý. Vui lòng thử lại.";
        }
        return detail;
    }
    
    public static Result<T> ToResultFailure<T>(this RpcException ex)
    {
        var errorCode = ex.StatusCode.ToEErrorCode();
        var cleanMessage = NormalizeGrpcErrorMessage(ex.Status.Detail);
        return Result<T>.Failure(cleanMessage, errorCode);
    }
    
    // 3. Tự động chuyển RpcException thành Result dạng Failure
    public static Result ToResultFailure(this RpcException ex)
    {
        var errorCode = ex.StatusCode.ToEErrorCode();
        var cleanMessage = NormalizeGrpcErrorMessage(ex.Status.Detail);
        return Result.Failure(cleanMessage, errorCode);
    }
}