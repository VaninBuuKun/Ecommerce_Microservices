# 🤖 ANTIGRAVITY AGENT GUIDELINES & PROJECT RULES

Welcome AI Agent! You are working on **Ecommerce Microservices**, an enterprise-grade multi-tenant e-commerce platform built with **.NET 9 Microservices** and a **React 19 Frontend**.

---

## 🏛️ System Architecture Overview

- **7 Microservices (REST Port / gRPC Port & DB)**:
  1. `Catalog.Api` (REST `5001` / gRPC `5002` - MySQL): Products, Variants, Categories, Product Reviews.
  2. `Cart.Api` (REST `5004` / gRPC `5005` - Redis): Cart management.
  3. `Orders.Api` (REST `5007` / gRPC `5008` - PostgreSQL): Orders, SubOrders, Vouchers, Refunds.
  4. `Identity.Api` (REST `5027` / gRPC `5028` - PostgreSQL): OAuth2 / OIDC, User Addresses.
  5. `Sellers.Api` (REST `5042` / gRPC `5043` - PostgreSQL): Seller KYC, Shop Onboarding & Management.
  6. `Payments.Api` (REST `5052` / gRPC `5053` - PostgreSQL): Payment Gateways (Momo, VNPay, COD), Wallet & Withdrawals.
  7. `Shippings.Api` (REST `5070` / gRPC `5071` - PostgreSQL): GHN Integration, Location Sync, Fee Calculation.
- **Inter-service Communication**:
  - Synchronous: **gRPC** (Centralized proto files in `BuildingBlocks.Grpc/Protos/*.proto`).
  - Asynchronous: **MassTransit + RabbitMQ** (Event Consumers in each service).

---

## 📐 Mandatory Coding Patterns & Rules

### 1. Backend (Clean Architecture + CQRS + MediatR)
- **Separation of Files**:
  - Every Query / Command MUST have its own file.
  - Every QueryHandler / CommandHandler MUST be in a separate file matching the name `[Name]QueryHandler.cs` or `[Name]CommandHandler.cs`.
  - Feature Folder Structure: `Features/[FeatureDomain]/[Queries|Commands]/[QueryName]/[QueryName]Query.cs` and `[QueryName]QueryHandler.cs`.
- **gRPC Server Protocol**:
  - `GrpcServer.cs` in `[ServiceName].Api/GrpcServers/` MUST act strictly as an **Adapter Layer**.
  - NEVER write direct database queries (`DbContext` or `UnitOfWork`) inside `GrpcServer.cs`.
  - ALWAYS delegate execution via MediatR: `var result = await sender.Send(new MyQuery(...), context.CancellationToken);`.
- **EF Core Enum Conversions**:
  - All Status enums in `DbContext` configuration MUST be stored as `string` using `.HasConversion<string>()`.
  - Never map enums to integer ordinals in DB.

### 2. Frontend (React 19 + TypeScript + ACO Architecture + Tailwind CSS v4)
- **Fixed Tech Stack**: React 19, TS 5.x, Vite 8, Tailwind CSS v4, TanStack Query v5, Zustand v5, React Hook Form + Zod, Axios, Framer Motion, Radix UI Primitives, React Toastify.
- **Apps - Components - Domains (ACO) Architecture**:
  - `src/apps/`: Page entry points grouped by actor domain (`customer/`, `seller/`, `admin/`, `auth/`).
  - `src/domains/`: Domain logic grouped by business boundary (`auth/`, `catalog/`, `cart/`, `order/`, `seller/`, `kyc/`, `address/`, `wallet/`, `shipping/`, `admin/`). Contains `api/`, `hooks/`, `stores/`, `types/`, `components/`, and `index.ts`.
  - `src/shared/`: Cross-cutting UI primitives (`ConfirmModal`, `Header`, `Footer`), utilities, and Axios instances.
- **Domain Isolation (NO Cross-Feature Coupling)**: Inter-domain imports MUST strictly go through domain index exports (`@/domains/[domainName]`). Never perform relative cross-domain imports.
- **Error Handling**: Catch errors in `useMutation` via `onError: (err: any) => { const msg = err.response?.data?.message || err.response?.data; }`.
- **Modal Popups**: All Modal Popups MUST use `createPortal(..., document.body)` with `z-10000` to prevent layout truncation or parent stacking context issues.
- **Form Validation**: Combine `@hookform/resolvers/zod` with `react-hook-form`. Display inline red text errors with alert icons under inputs.

### 3. Session End Protocol (Auto Context & Rules Synchronization)
- At the end of every conversation turn / task completion, the AI Agent MUST:
  1. Check if any new Commands, Queries, Handlers, APIs, or UI Components were added/modified. If so, update `.agents/context/01_business_capabilities.md` and `readme.md`.
  2. Check if any new architectural patterns, conventions, or guidelines were established. If so, update `.agents/rules/*.md` and `AGENTS.md`.
  3. Log the latest working state into `.antigravity/scratchpad.md`.

---

## 📚 Project Documentation & Truth Files

- **`.agents/context/01_business_capabilities.md` & `readme.md`**: Contains a complete list of all currently implemented handlers, APIs, consumers, and business capabilities. ALWAYS consult these files when inspecting existing business capabilities!
