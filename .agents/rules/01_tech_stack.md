# 01. Technology Stack & Architecture

## System Overview
- **Backend**: .NET 9 Web APIs, Clean Architecture, CQRS (MediatR 12+), EF Core 9.
- **Frontend**: React 19, TypeScript 5.x, Vite 7, TanStack Query v5, Tailwind CSS v4.
- **Microservices Ports Matrix (REST / gRPC)**:
  1. `Catalog.Api`: REST `5001` | gRPC `5002` (MySQL)
  2. `Cart.Api`: REST `5004` | gRPC `5005` (Redis)
  3. `Orders.Api`: REST `5007` | gRPC `5008` (PostgreSQL)
  4. `Identity.Api`: REST `5027` | gRPC `5028` (PostgreSQL)
  5. `Sellers.Api`: REST `5042` | gRPC `5043` (PostgreSQL)
  6. `Payments.Api`: REST `5052` | gRPC `5053` (PostgreSQL)
  7. `Shippings.Api`: REST `5070` | gRPC `5071` (PostgreSQL)
- **Inter-service Communication**:
  - Sync: gRPC (`BuildingBlocks.Grpc/Protos/*.proto`)
  - Async: MassTransit + RabbitMQ
