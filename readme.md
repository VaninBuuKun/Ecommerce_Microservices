# 🛒 Multi-Vendor Ecommerce Microservices Platform

An enterprise-grade **Marketplace Ecommerce Platform** built with modern **Microservices Architecture** using **.NET 9**, **Clean Architecture**, **CQRS + MediatR**, **MassTransit Saga & Transactional Outbox**, and **React 19**.

---

# 🏛️ 1. System Architecture

```text
[ React 19 Frontend ]
        │ (HTTP REST / JSON)
        ▼
[ YARP API Gateway ] ── (CORS / Rate Limiting / Routing)
        │
        ├──► Catalog.Api      (REST 5001 / gRPC 5002) ──► PostgreSQL
        ├──► Cart.Api         (REST 5004 / gRPC 5005) ──► Redis
        ├──► Orders.Api       (REST 5007 / gRPC 5008) ──► PostgreSQL
        ├──► Payments.Api     (REST 5052 / gRPC 5053) ──► PostgreSQL
        ├──► Shippings.Api    (REST 5070 / gRPC 5071) ──► PostgreSQL
        ├──► Sellers.Api      (REST 5042 / gRPC 5043) ──► PostgreSQL
        ├──► Identity.Api     (REST 5027 / gRPC 5028) ──► PostgreSQL
        ├──► Notifications.Api(REST 5080 / gRPC 5081) ──► PostgreSQL
        ├──► Recommendations.Api(REST 5090 / gRPC 5091) ──► PostgreSQL
        └──► Analytics.Api    (REST 5095 / gRPC 5096) ──► PostgreSQL

[ Synchronous Communication ]
gRPC + Protocol Buffers

[ Asynchronous Communication ]
MassTransit + RabbitMQ
Saga State Machine + Transactional Outbox
```

---

# 🛠️ 2. Services & Ports

| Service               | REST | gRPC | Database   | Responsibilities                                            |
| --------------------- | ---- | ---- | ---------- | ----------------------------------------------------------- |
| **Catalog.Api**       | 5001 | 5002 | PostgreSQL | Product Catalog, SKU Variants, Inventory, Ratings & Reviews, Smart Search |
| **Cart.Api**          | 5004 | 5005 | Redis      | Shopping Cart, Shop Grouping                                |
| **Orders.Api**        | 5007 | 5008 | PostgreSQL | Orders, SubOrders, Vouchers, Refund Workflow                |
| **Identity.Api**      | 5027 | 5028 | PostgreSQL | Authentication, Authorization, OAuth2/OIDC, User Addresses, User Count |
| **Sellers.Api**       | 5042 | 5043 | PostgreSQL | KYC Verification, Shop Management, Pickup Addresses, Follow |
| **Payments.Api**      | 5052 | 5053 | PostgreSQL | VNPay, MoMo, COD, Seller Wallets, Withdrawals               |
| **Shippings.Api**     | 5070 | 5071 | PostgreSQL | GHN Integration, Shipping Rates, Delivery Tracking          |
| **Notifications.Api** | 5080 | 5081 | PostgreSQL | SignalR Realtime Notifications                              |
| **Recommendations.Api** | 5090 | 5091 | PostgreSQL | AI Product Recommendations (Similar, For-You, Trending), View Tracking |
| **Analytics.Api**     | 5095 | 5096 | PostgreSQL | Seller & Admin Analytics, Daily Revenue Timeline, Top Products Materialization |

---

# ✨ 3. Platform Capabilities & Features

## 🛍️ Customer Storefront & Shopping Experience

* **Catalog Browsing & Smart Search**:
  * 2-level hierarchical category taxonomy with high-resolution visual cues and category breadcrumbs.
  * Typo-tolerant full-text search with automated search history and guest-to-user history synchronization.
  * Real-time trending searches with hot rank badges and background decay.
  * Smart natural language search suggestions (price ranges, star ratings, categories, and dynamic product attributes).
  * Comprehensive filters by category, price range, brand, specifications, and rating with multi-criteria sorting.
* **AI-Powered Product Recommendations**:
  * Personalized **"For You"** hybrid feed based on browsing behavior, purchase history, and wishlists.
  * Real-time **Trending 24h** feed factoring in recent views, order volume, and customer ratings.
  * **Similar Products** recommendations on product detail pages based on category, shop, and price proximity.
* **Product Detail & Variants**:
  * Interactive multi-tier variant selection (e.g. Color, Size) with real-time stock availability and dynamic price updates.
  * Customer ratings and multimedia reviews with verified purchase badges.
  * Personal wishlist tracking and direct shop following.
* **Cart, Checkout & Payments**:
  * Session-less shopping cart with multi-shop product grouping, bulk selection, and out-of-stock indicators.
  * Fast 1-click "Buy Now" and re-ordering from previous purchases.
  * Transparent checkout calculation with automated Giao Hàng Nhanh (GHN) shipping fees, shop vouchers, and platform discounts.
  * Multiple payment options: Cash on Delivery (COD), MoMo QR, and VNPay with automated status callbacks.
  * Idempotent order placement preventing duplicate charges on network retries or double clicks.
* **Order Tracking, Refunds & Customer Service**:
  * Visual real-time order lifecycle tracking from seller confirmation, packaging, and GHN shipping to final delivery.
  * Buyer refund request workflow with photo/video evidence submission.
  * Real-time customer ↔ shop chat with multimedia attachments, message quoting, and floating chat widget.
  * Notification center with categorized alerts (orders, wallet, account security) and transactional email updates.

---

## 🏬 Seller Center & Merchant Tools

* **Merchant Onboarding & KYC**:
  * Streamlined seller registration with dual-photo national ID verification and admin approval workflow.
* **Shop Management & Followers**:
  * Public shop profile customization (branding, logo, description, pickup address).
  * Follower community management with date-range tracking and direct customer order history inspection.
* **Multi-Tier Product & Inventory Management**:
  * Visual variant matrix builder supporting multi-level specifications with drag-and-drop reordering.
  * Bulk pricing, stock, and SKU updates.
  * Conflict-aware status toggles and deletion safeguards preventing accidental modifications while active sub-orders exist.
* **Order Fulfillment & Shipping**:
  * Centralized order fulfillment pipeline: Confirm order → Prepare package → Hand off to GHN logistics.
  * Automatic shipment waybill generation and real-time carrier tracking.
  * Seller refund management: Review customer claims, inspect proof, and approve or reject refunds with automatic stock/balance restoration.
* **Seller Wallet & Financial Payouts**:
  * Real-time shop wallet tracking net sales proceeds, deducted marketplace commissions, and pending balances.
  * Bank account management and withdrawal requests with status tracking.
* **Shop Analytics & Revenue Dashboard**:
  * Visual sales and revenue trendline charts across flexible timeframes (Today, 3 days, 7 days, or Custom Month/Year).
  * Product-level performance breakdown: Top-selling products, revenue rankings, and sales volume drilldowns.

---

## 🛡️ Platform Administration & Governance

* **Executive Dashboard & Business Intelligence**:
  * System-wide overview of Gross Merchandise Value (GMV), platform commissions, net profits, and voucher burn.
  * Platform-wide revenue trendlines and top-performing products across all shops.
* **Merchant & KYC Governance**:
  * Seller KYC verification management with document inspection, approval, and rejection with feedback reasons.
  * Shop governance: Marketplace-wide shop directory with moderation controls (Active, Suspend, Ban).
* **Catalog & Category Management**:
  * Full 2-level category tree CRUD with hierarchical classification and sorting.
  * Product catalog moderation, inventory oversight, and dynamic homepage banners/carousels management.
* **Order & Logistics Oversight**:
  * System-wide order and sub-order monitoring across all marketplace shops.
  * GHN shipment tracking inspection and carrier webhook audit logs.
  * Refund & dispute escalation management with balance restoration.
* **Vouchers & Platform Promotions**:
  * Platform-wide and shop-scoped voucher CRUD (percentage discounts, fixed amounts, minimum order requirements, usage limits).
* **Finance & Payout Operations**:
  * Global marketplace commission rate configuration.
  * Seller withdrawal request review, verification, and completion with payment proof receipt uploads.
* **Security & Access Control (RBAC)**:
  * Role-based administration (`Admin`, `Manager`, `Staff`, `User`).
  * Account lock/unlock controls and login device audit history.
  * Immediate session revocation with gateway token blacklisting.

---

## ⚡ Cross-Cutting Platform Highlights

* **Real-time Communication & Messaging**:
  * SignalR-powered messaging between buyers and seller shops, featuring message quoting, multimedia attachments, and custom chat themes.
  * Dynamic HTML email engine for transaction lifecycle events (welcome, OTP, login security alerts, order updates, and payout receipts).
* **Logistics & Automated Geo-Sync**:
  * Deep integration with Giao Hàng Nhanh (GHN) API with automated Province/District/Ward geographic synchronization.
  * Multi-tier location caching (L1 In-Memory + L2 Redis) for sub-millisecond fee calculations.
* **Distributed Resilience & Event Architecture**:
  * MassTransit Saga State Machine and Transactional Outbox ensuring eventual consistency across orders, payments, inventory, and logistics.
  * Centralized YARP API Gateway with rate limiting, CORS, and O(1) Redis-backed token revocation.
  * Hangfire automated background jobs for 7-day delivered order auto-completion and 30-day notification log retention.

---

# 📐 4. Architectural Standards

## Clean Architecture CQRS vs Service Layer Pattern

* **CQRS + MediatR Services (`Catalog.Api`, `Orders.Api`)**: Strict separation of Commands and Queries, dedicated Handler files, and feature-driven folder structures.
* **Service Layer Pattern Services (`Payments.Api`, `Sellers.Api`, `Shippings.Api`, `Identity.Api`, `Cart.Api`, `Notifications.Api`, `Recommendations.Api`)**: direct interface dependency injection (`Models/Interfaces/I[Name]Service.cs`), and centralized service implementations (`Services/`).

## Cascading Developer AppSettings Architecture

Strict 2-layer configuration hierarchy across all microservices:
1. `appsettings.json` (Committed): Base skeleton template with public endpoints and safe local defaults.
2. `appsettings.Developer.json` (Git-ignored): Active developer secrets and environment overrides.
* **Automatic Deep Merging**: `builder.AddCustomConfiguration()` in `BuildingBlocks.Logging` automatically registers and merges `appsettings.Developer.json` (with fallback to `appsettings.Local.json`) without modifying individual service `Program.cs`.

## Automated Multi-Service Database Migration Utility

* Centralized shell script `update-db.sh` supporting automated EF Core migration generation and database application across all services (`catalog`, `orders`, `identity`, `sellers`, `payments`, `shippings`, `notifications`, `recommendations`, or `all`).

## gRPC Presentation Adapter Pattern

gRPC servers strictly act as transport adapters, delegating execution to the Application Layer / Service Layer without direct database or DbContext queries.

## gRPC Client Abstraction

Inter-service communication wrapped behind service abstractions with `RpcException` → `Result<T>` mapping.

## Unit of Work & Repository Pattern

Database access abstracted through `IEfUnitOfWork` and `IGenericEfRepository<T>`.

## EfDbContextBase — Automatic Date Tracking

`SaveChangesAsync()` automatically populates `CreatedDate` and `LastModifiedDate` for all `IDateTracking` entities.

## Background Jobs & Hangfire Abstraction

Decoupled via `IBackgroundJobManager` (Fire-and-forget, Delayed, Recurring) in `BuildingBlocks.Shared` backed by `BuildingBlocks.BackgroundJobs` (Hangfire + PostgreSQL).
* **Delayed Job**: 7-day auto-completion for delivered sub-orders scheduled individually per sub-order without database table polling.
* **Recurring Job**: Automated daily purge of notifications older than 30 days (`0 2 * * *`).

## Token Revocation Middleware at API Gateway

YARP reverse proxy pipeline integrates `TokenRevocationMiddleware`, performing O(1) Redis lookups (`auth:revoked_before:{userId}`) against token `iat` claims to instantly reject stale sessions after password changes.

## MassTransit Saga & Transactional Outbox

Ensures reliable event delivery with distributed transaction orchestration.

## Snowflake ID Generator

64-bit distributed unique IDs for Orders (non-sequential, non-guessable).

---

## Frontend Architecture (React 19)

Three-layer ACO (Apps - Components - Domains) architecture:

```text
apps/     → Page entry points by role (customer, seller, admin, auth)
domains/  → Business domain modules (auth, catalog, cart, order, seller, kyc, address, wallet, shipping, admin, notification)
shared/   → Reusable UI primitives & utilities
```

### UI Standards

* React Toastify for all user feedback (no `alert()`)
* Modals via `createPortal(..., document.body)` with `z-10000`
* Component files max ~300 lines — decompose larger components
* Tailwind CSS v4 utility-first styling
* Framer Motion animations

---

# 🚀 5. Getting Started

## Prerequisites

* .NET 9 SDK
* Node.js 20+

Infrastructure Components:
* PostgreSQL
* Redis
* RabbitMQ

## Start Infrastructure

```bash
docker compose up -d
```

## Run Backend Services

```bash
dotnet build Microservices.sln
```

Run services from Visual Studio, JetBrains Rider, or .NET CLI.

## Run Frontend

```bash
cd frontend-web
npm install
npm run dev
```

Application URL: `http://localhost:5173`

---

# 🐳 Production Deployment

Deploy the complete stack on a VPS using Docker Compose.

```bash
cd src
cp .env.example .env
nano .env
docker compose -f docker-compose.prod.yaml --env-file .env up -d
```

This deployment includes:
* API Gateway
* Frontend
* All Backend Services
* Databases
* Message Broker
* Observability Stack

---

# 🔧 Technology Stack

### Backend

* .NET 9 / ASP.NET Core
* MediatR / FluentValidation
* MassTransit + RabbitMQ
* gRPC + Protocol Buffers
* Entity Framework Core 9
* Duende IdentityServer (OAuth2/OIDC)
* SignalR (Real-time)
* Hangfire (Background & Scheduled Jobs)

### Databases

* PostgreSQL
* MySQL
* Redis

### Frontend

* React 19 / TypeScript 5.x
* Vite 8
* Tailwind CSS v4
* TanStack Query v5
* Zustand v5
* React Hook Form + Zod
* Framer Motion
* Radix UI
* React Toastify
* Axios

### Infrastructure

* Docker / Docker Compose
* YARP API Gateway

### Observability

* OpenTelemetry
* Grafana / Loki / Tempo

---

# 📚 Documentation & Guidelines

* [Git Commit Conventions](file:///home/vanmuzic/Projects/Ecommerce_Microservices/docs/COMMIT_CONVENTION.md) - Standardized commit formats, scopes, and Git workflows.
* [Migration & AWS Setup Guide](file:///home/vanmuzic/Projects/Ecommerce_Microservices/docs/MIGRATION_AND_AWS_SETUP_GUIDE.md) - Database migrations and cloud setup guide.

---

# 📄 License

This project is developed for learning, portfolio, and enterprise-scale ecommerce architecture experimentation.
