# 02. Coding Standards & Architectural Rules

## 1. Backend Standards (Clean Architecture + CQRS + DDD)

- **File Separation**: Every Query/Command MUST be in a separate file from its QueryHandler/CommandHandler.
  - `Features/[Domain]/[Queries|Commands]/[Name]/[Name]Query.cs`
  - `Features/[Domain]/[Queries|Commands]/[Name]/[Name]QueryHandler.cs`

- **gRPC Presentation Adapter Pattern**:
  - `GrpcServer.cs` in `*.Api/GrpcServers/` or `Services/` acts STRICTLY as a Presentation Adapter.
  - Direct `DbContext` or `IEfUnitOfWork` usage inside `GrpcServer.cs` is PROHIBITED. Always delegate via MediatR `ISender`.

- **gRPC Client Service Abstraction (`grpcClientService`)**:
  - Inter-service gRPC calls MUST be wrapped inside a Client Service class implementing a domain interface (e.g., `ProductClientService : IProductService`).
  - Located in `GrpcClients/` or `Services/`.
  - Catches `RpcException` and maps to `Result<T>` using `e.ToResultFailure<T>()`.

- **UnitOfWork & Generic Repository Pattern**:
  - Data persistence MUST use `IEfUnitOfWork` and `IGenericEfRepository<T>`.
  - Write operations follow: `BeginTransactionAsync()` ➔ `Repository.AddAsync()` / `UpdateAsync()` ➔ `SaveChangesAsync()` ➔ `CommitTransactionAsync()`.

- **MassTransit Saga & Outbox Pattern**:
  - Event-driven workflows and state machines use MassTransit + RabbitMQ.
  - Transactional Outbox pattern is configured in DbContext to ensure reliable event publishing alongside database commits.

- **EF Core Enum Conversions**:
  - All status enums in DbContext configuration MUST use `.HasConversion<string>()`. Never store integer ordinals.

- **Result Pattern & HTTP Mapping**:
  - Handlers return `Result<T>`.
  - Controllers map `Result` failures using `result.GetHttpStatusCode()` and `result.Message` or `result.ErrorCode`.

---

## 2. Frontend Standards (React 19 + TypeScript + TanStack Query + Tailwind CSS)

- **Modal Overlay Portal**:
  - All Modal Popups MUST render using `createPortal(..., document.body)` with `z-10000` to prevent stacking context clipping.

- **Form Validation**:
  - Use `@hookform/resolvers/zod` with `react-hook-form`. Display inline red text errors with alert icons under inputs.

---

## 3. Session End Auto-Sync Protocol (Mandatory Agent Rule)
At the end of every conversation session or task completion, the AI Agent MUST:
1. **Check for New Capabilities**: If new Handlers, Endpoints, Consumers, or UI pages were built, update `.agents/context/01_business_capabilities.md` and `readme.md`.
2. **Check for New Rules / Patterns**: If new architectural decisions or coding standards were established, update `.agents/rules/*.md` and `AGENTS.md`.
3. **Check Workflow & Diagrams**: If transaction flows changed, update `.agents/context/03_checkout_flow.md`.
4. **Log Scratchpad State**: Record working progress in `.antigravity/scratchpad.md`.
