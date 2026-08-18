# 02. Architecture & Design Patterns

## 1. Clean Architecture Layers
- **Domain**: Pure C# entities, Value Objects, Domain Enums, Domain Exceptions.
- **Application**: CQRS Commands/Queries, MediatR Handlers, DTOs, Validators (FluentValidation), Interfaces (`IEfUnitOfWork`, `IGenericEfRepository`).
- **Infrastructure**: Persistence (`DbContext`), EF Core configurations, gRPC Client Services (`grpcClientService`), MassTransit Consumers, External API integrations (GHN, Momo, VNPay).
- **Api**: ASP.NET Core Controllers, gRPC Servers (`GrpcServer.cs`), Service Registration, Middleware.

## 2. CQRS Pattern & File Conventions
- Handlers MUST NEVER be combined in the same file as Query/Command records.
- Name format: `[Name]Query.cs` + `[Name]QueryHandler.cs`.
- Execution: Controllers & gRPC Servers invoke MediatR `sender.Send(query/command, cancellationToken)`.

## 3. gRPC Client Service Wrapper (`grpcClientService`)
- Encapsulates low-level protobuf calls into strongly-typed C# domain interfaces (e.g. `ProductClientService : IProductService`).
- Handles `RpcException` and maps error status codes to `Result<T>.Failure(message, errorCode)`.

## 4. UnitOfWork & Generic Repository
```csharp
await unitOfWork.BeginTransactionAsync(cancellationToken);
await repository.AddAsync(entity);
await unitOfWork.SaveChangesAsync(cancellationToken);
await unitOfWork.CommitTransactionAsync(cancellationToken);
```

## 5. MassTransit Saga & Transactional Outbox Pattern
- Event publishing is coupled with DbContext transactions via Outbox Pattern to prevent ghost events during DB rollbacks.
- MassTransit State Machines handle distributed sagas (SubOrder lifecycle & payment/refund orchestration).
