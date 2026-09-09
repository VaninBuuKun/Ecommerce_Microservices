# 🤖 ANTIGRAVITY AGENT GUIDELINES & PROJECT RULES

Welcome AI Agent! You are working on **Ecommerce Microservices**, an enterprise-grade multi-tenant e-commerce platform built with **.NET 9 Microservices** and a **React 19 Frontend**.

---

## 🏛️ System Architecture Overview

- **8 Microservices (REST Port / gRPC Port & DB)**:
  1. `Catalog.Api` (REST `5001` / gRPC `5002` - PostgreSQL): Products, Variants, Categories, Product Reviews.
  2. `Cart.Api` (REST `5004` / gRPC `5005` - Redis): Cart management.
  3. `Orders.Api` (REST `5007` / gRPC `5008` - PostgreSQL): Orders, SubOrders, Vouchers, Refunds.
  4. `Identity.Api` (REST `5027` / gRPC `5028` - PostgreSQL): OAuth2 / OIDC, User Addresses.
  5. `Sellers.Api` (REST `5042` / gRPC `5043` - PostgreSQL): Seller KYC, Shop Onboarding & Management.
  6. `Payments.Api` (REST `5052` / gRPC `5053` - PostgreSQL): Payment Gateways (Momo, VNPay, COD), Wallet & Withdrawals.
  7. `Shippings.Api` (REST `5070` / gRPC `5071` - PostgreSQL): GHN Integration, Location Sync, Fee Calculation.
  8. `Notifications.Api` (REST `5080` / gRPC `5081` - PostgreSQL): Email notifications, Smtp, System alerts.
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
- **API Axios Client Import**: ALWAYS import `api` from `@/core` (`import { api } from "@/core";`). Never import `axiosInstance` directly or create ad-hoc axios instances.
- **TypeScript Type Imports**: ALWAYS use `import type { ... }` when importing interfaces, types, or DTOs in TypeScript files (`import type { NotificationDto } from "..."`).
- **Domain Isolation (NO Cross-Feature Coupling)**: Inter-domain imports MUST strictly go through domain index exports (`@/domains/[domainName]`). Never perform relative cross-domain imports.
- **Error Handling**: Catch errors in `useMutation` via `onError: (err: any) => { const msg = err.response?.data?.message || err.response?.data; }`.
- **Modal Popups**: All Modal Popups MUST use `createPortal(..., document.body)` with `z-10000` to prevent layout truncation or parent stacking context issues.
- **Form Validation**: Combine `@hookform/resolvers/zod` with `react-hook-form`. Display inline red text errors with alert icons under inputs.


### 3. Security & AppSettings Configuration Standard (Strict Cascading Layer)
- **2-Layer Configuration Architecture**:
  1. `appsettings.json` (Committed to Git): Acts as the base skeleton and self-contained example template (Kestrel endpoints, Serilog, Yarp routes, CORS, and safe local defaults like PostgreSQL `127.0.0.1:5433`, RabbitMQ `guest/guest`). **NEVER** commit real third-party secrets, API keys, or private passwords here; ALWAYS use safe placeholders (`YOUR_MOMO_SECRET_KEY`, `YOUR_GHN_API_TOKEN`, `YOUR_GMAIL_APP_PASSWORD`).
  2. `appsettings.Developer.json` (Git-Ignored via `*.Developer.json`): Contains actual local developer credentials and active secrets. Developers only specify the keys they wish to override.
- **Automatic Loading & Deep Merging**:
  - `builder.AddCustomConfiguration()` in `BuildingBlocks.Logging` automatically registers `builder.Configuration.AddJsonFile("appsettings.Developer.json", optional: true, reloadOnChange: true);` (with fallback to `appsettings.Local.json`).
  - All services calling `builder.AddCustomSerilog(...)` automatically inherit this override. NEVER duplicate this loader in individual `Program.cs`.
  - In Production / Docker / CI-CD: Configuration MUST be injected via Environment Variables (`ConnectionStrings__Database`, `Momo__SecretKey`).


### 4. Session End Protocol & Scratchpad Synchronization Rule
- At the end of every conversation turn / task completion, the AI Agent MUST:
  1. Check if any new Commands, Queries, Handlers, APIs, or UI Components were added/modified. If so, update `.agents/context/01_business_capabilities.md` and `readme.md`.
  2. Check if any new architectural patterns, conventions, or guidelines were established. If so, update `.agents/rules/*.md` and `AGENTS.md`.
  3. Log the latest working state into `.antigravity/scratchpad.md`.
- **Scratchpad Trimming & Capabilities Sync Rule**:
  - Whenever `.antigravity/scratchpad.md` exceeds **20 items**, the AI Agent MUST trim (delete) the first 20 oldest items to maintain a lean context.
  - **MANDATORY**: Before deleting the first 20 items, the AI Agent MUST verify that all feature descriptions, MediatR handlers, API routes, and UI components from those items are fully reflected and updated in `.agents/context/01_business_capabilities.md` and `readme.md` so no project context is lost.


---

## 📚 Project Documentation & Truth Files

- **`.agents/context/01_business_capabilities.md` & `readme.md`**: Contains a complete list of all currently implemented handlers, APIs, consumers, and business capabilities. ALWAYS consult these files when inspecting existing business capabilities!
