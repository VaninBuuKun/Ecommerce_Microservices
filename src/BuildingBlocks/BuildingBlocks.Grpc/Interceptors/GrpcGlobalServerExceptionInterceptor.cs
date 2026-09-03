using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Domains;
using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Grpc.Interceptors;

public class GrpcGlobalServerExceptionInterceptor(ILogger<GrpcGlobalServerExceptionInterceptor> logger) : Interceptor
{
    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request,
        ServerCallContext context,
        UnaryServerMethod<TRequest, TResponse> continuation)
    {
        try
        {
            return await continuation(request, context);
        }
        catch (RpcException rpcEx)
        {
            logger.LogWarning("gRPC RpcException occurred in {Method}. Status: {StatusCode}, Detail: {Detail}",
                context.Method, rpcEx.StatusCode, rpcEx.Status.Detail);
            throw;
        }
        catch (DomainException domainEx)
        {
            logger.LogWarning(domainEx, "DomainException in gRPC method {Method}: {Message}", context.Method, domainEx.Message);
            throw new RpcException(new Status(StatusCode.InvalidArgument, domainEx.Message));
        }
        catch (FluentValidationException validationEx)
        {
            logger.LogWarning(validationEx, "ValidationException in gRPC method {Method}: {Message}", context.Method, validationEx.Message);
            throw new RpcException(new Status(StatusCode.InvalidArgument, validationEx.Message));
        }
        catch (KeyNotFoundException notFoundEx)
        {
            logger.LogWarning(notFoundEx, "Resource not found in gRPC method {Method}: {Message}", context.Method, notFoundEx.Message);
            throw new RpcException(new Status(StatusCode.NotFound, notFoundEx.Message));
        }
        catch (UnauthorizedAccessException unauthorizedEx)
        {
            logger.LogWarning(unauthorizedEx, "Unauthorized access in gRPC method {Method}: {Message}", context.Method, unauthorizedEx.Message);
            throw new RpcException(new Status(StatusCode.Unauthenticated, unauthorizedEx.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled Exception in gRPC method {Method}. Request: {@Request}. Error: {Message}",
                context.Method, request, ex.Message);

            var errorMessage = string.IsNullOrWhiteSpace(ex.Message)
                ? "Lỗi xử lý nội bộ tại dịch vụ liên kết gRPC"
                : ex.Message;

            throw new RpcException(new Status(StatusCode.Internal, errorMessage));
        }
    }

    public override async Task ServerStreamingServerHandler<TRequest, TResponse>(
        TRequest request,
        IServerStreamWriter<TResponse> responseStream,
        ServerCallContext context,
        ServerStreamingServerMethod<TRequest, TResponse> continuation)
    {
        try
        {
            await continuation(request, responseStream, context);
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled Exception in Streaming gRPC method {Method}: {Message}", context.Method, ex.Message);
            throw new RpcException(new Status(StatusCode.Internal, string.IsNullOrWhiteSpace(ex.Message) ? "Lỗi streaming tại gRPC server" : ex.Message));
        }
    }
}
