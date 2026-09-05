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
        └──► Notifications.Api(REST 5080)              ──► PostgreSQL

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
| **Identity.Api**      | 5027 | 5028 | PostgreSQL | Authentication, Authorization, OAuth2/OIDC, User Addresses  |
| **Sellers.Api**       | 5042 | 5043 | PostgreSQL | KYC Verification, Shop Management, Pickup Addresses, Follow |
| **Payments.Api**      | 5052 | 5053 | PostgreSQL | VNPay, MoMo, COD, Seller Wallets, Withdrawals               |
| **Shippings.Api**     | 5070 | 5071 | PostgreSQL | GHN Integration, Shipping Rates, Delivery Tracking          |
| **Notifications.Api** | 5080 | —    | PostgreSQL | SignalR Realtime Notifications                              |

---

# ✨ 3. Implemented Business Capabilities

## 🏬 Seller Center

### KYC Verification

* National ID verification with front/back image upload.
* Approval workflow: Draft → Submitted → Approved / Rejected.
* Admin KYC management panel with approve/reject actions.

### Shop Management

* Shop creation after successful KYC approval.
* Shop profile management (name, description, logo, address).
* Pickup address management integrated with GHN locations.
* Shop activate / suspend / ban (Admin).
* Follow / Unfollow shops (Customer).

### Seller Wallet

* Wallet activation.
* Bank account management (add, update).
* Transaction history.
* Withdrawal requests with admin approval workflow.

---

## 🛍️ Product Catalog & Shopping Cart

### Product Management

* Product creation with rich description.
* Product variant matrix (options → variants with SKU/price/stock).
* Bulk variant updates.
* Sale price configuration.
* Product activation/deactivation.
* Shipping dimensions and weight configuration.
* Price range indexing (`Price` & `MaxPrice`) for min/max price range filtering.
* Native `jsonb` attributes storage with PostgreSQL GIN index (`jsonb_path_ops`).
* PostgreSQL Trigram (`pg_trgm`) & `unaccent` for accent-insensitive typo-tolerant search.

### 🔍 Smart Search & Discovery

* **Search History (Redis List)**: Stores the 5 most recent search queries per authenticated user (`search:history:{userId}`) with individual deletion and clear all.
* **Guest History Sync**: Automatically synchronizes guest local search history to Redis upon user login via `POST /api/products/search-history/sync`.
* **Trending Searches (Redis Sorted Set)**: Tracks top 5 hot queries with rank badges, debounced increment rate-limiting, and background decay service (`HalfLifeHours`). Supports campaign duration overrides and pinned promotional keywords.
* **Smart Intent Suggestions**: Real-time regex intent parser extracting price constraints (e.g., `dưới 500k`, `từ 100k đến 200k`), star ratings (`4 sao trở lên`), popularity (`bán chạy`), categories, and dynamic specification attributes. Directs users to `/explore` with pre-filled structured filters.
* **Streamlined Explore Page**:
  * Root categories removed from main view; focuses exclusively on subcategories.
  * Preserves and accumulates subcategories across filter changes and infinite scroll batches (subcategory list never shrinks unexpectedly).
  * Direct subcategory navigation from landing page and product detail breadcrumbs.
  * Consolidated sorting select box (`Mới nhất`, `Cũ nhất`, `Giá thấp đến cao`, `Giá cao đến thấp`, `Bán chạy nhất`) and dynamic result counter ("Tìm thấy X sản phẩm").
  * Clean product grid focused on browsing without redundant detail-only action buttons.

### Ratings & Reviews

* Star ratings with review text.
* Media uploads in reviews.
* Review eligibility validation via gRPC (completed purchase count).

### Wishlists

* Toggle wishlist for products.
* Wishlist page with product grid.

### Redis Shopping Cart

* Add/update/remove products.
* Product selection for checkout.
* Automatic grouping by seller shop.
* Select all / deselect all.
* **1-Call Rebuy & Buy-Now**: Server-side resolution of sub-orders or variant lists with shop ownership validation and automatic unselect of other items.
* **Out-of-Stock Handling**: Zero-quantity items displayed with dimmed styling, disabled checkbox and "Hết hàng" badges.

---

## 🛒 Checkout, Orders & Payments

### Checkout Calculation & Idempotency

* Product subtotal, platform vouchers, and shop vouchers.
* Shipping fee calculation via GHN gRPC integration.
* Redis checkout session for calculation data persistence.
* **Idempotent Order Placement**: Deduplication via `X-Idempotency-Key` and Redis cache (`order:idempotency:{customerId}:{key}`) with 5-minute TTL to prevent double-charging and duplicate order generation on network retry or double clicks.

### Multi-Shop Orders

A single checkout is automatically split into multiple SubOrders based on seller shop ownership.

### Order & Saga State Machine Lifecycle

```text
[ AwaitingConfirmation ]
          │  (Seller confirms order)
          ▼
    [ Processing ] ── (Package ready → CreateShipmentRequest to GHN)
          │  (GHN shipper picks up package / SubOrderShippedEvent)
          ▼
     [ Shipping ]
          │  (GHN delivery success / SubOrderDeliveredEvent)
          ▼
    [ Delivered ]  ── (Enqueues 7-day Hangfire delayed auto-complete job)
          │
    ┌─────┴───────────────────────┐
    ▼                             ▼
[ Completed ]                [ Refunded ]
(Customer confirm /       (Refund request approved
 7-day Hangfire job)       by seller / admin)
```

### Payment Integration

Supported payment methods:
* MoMo QR Payment (Sandbox)
* VNPay (Sandbox)
* Cash On Delivery (COD)

Payment webhooks automatically trigger status transitions via MassTransit events.

### Refund Workflow

* Buyer submits refund request with evidence media.
* Seller approves or rejects refund.
* Automatic refund balance restoration and stock release via Saga orchestration.

---

## 🚚 Shipping & Logistics

### GHN Integration

* Province/District/Ward synchronization (cron job).
* Shipping fee calculation (batch support).
* Automatic shipment creation (waybill).
* Shipment tracking via webhooks.

### Delivery Workflow

```text
GHN Delivered → ShipmentDeliveredEvent → Orders Service → SubOrder Delivered
                                                        → SellerRevenueConsumer → Seller Wallet Credit
```

---

## 🛡️ Administration & Governance

### Admin Dashboard

* **Products Overview**: Approval, inventory, pricing, specification attributes, and status management.
* **Dynamic Banners & Carousels**: Full CRUD with priority ordering, status toggle, link routing, and live theme color customizers.
* **Order & SubOrder Management**: Multi-shop order tracking, status overrides, keyword searching, and pagination.
* **Shipment Tracking**: GHN waybill tracking logs and webhook sync inspection.
* **Refund Management**: Proof review, approve/reject workflows with balance restoration.
* **Category Tree Management**: Hierarchical category tree management with drag/sort order.
* **User & Security Governance**: Lock/unlock accounts, role assignments, device login history inspection.
* **Shop Governance**: Shop status moderation (Active, Suspend, Ban), owner validation.
* **KYC Verification Workflow**: Dual-photo ID verification, status progression (Draft → Submitted → Approved/Rejected).
* **Voucher Management**: Platform-wide and shop-scoped voucher CRUD (discount percentage/fixed, minimum order, usage limits).
* **Wallet & Withdrawal Management**: Admin review, approval, rejection, and final completion with proof payment receipt upload.
* **Platform Commission Configuration**: Global marketplace fee rate adjustment (`/api/admin/commission`).

### Available Roles

* `Admin` — Full platform management, commission settings, moderation, and finance approvals.
* `Manager` — Operations, catalog, order processing, and merchant verification.
* `Staff` — Customer support, order inspection, and verification assistance.
* `User` — Marketplace customer and seller shop owner.

---

## 🔔 Real-time Notifications, Chat & Email

### Real-time Messaging & Floating Chat
* **SignalR Customer ↔ Shop Chat Page (`/chat`)**: Fullscreen real-time communication between buyers and seller shops with chat history.
* **Floating Chat Bubble & Modal (`ChatBubbleButton` + `ChatMiniModal`)**: 2-column popup chat widget accessible across all customer and seller pages.
* **Room Customization**: Custom theme colors and background styling per conversation (`ThemeColor`, `BackgroundColor`).

### Isolated HTML Email Template Engine
* **Dynamic Template Renderer**: Decoupled HTML templates in `Templates/Emails/` (`OtpEmail.html`, `WelcomeEmail.html`, `WithdrawalSuccessEmail.html`, `NewDeviceAlertEmail.html`, `PasswordChangedSuccessEmail.html`) rendered dynamically via `ITemplateRenderer`.
* **Withdrawal Completion Notification**: Automatic email notification with formatted amount, bank info, and proof payment receipt image (`ProofImageUrl`).

### Security, Device Intelligence & Session Revocation
* **Device Fingerprint Recognition (`UserKnownDevices`)**: Persistent hardware/environment fingerprinting (`DeviceHash`, `DeviceName`, `LastIpAddress`) to eliminate repetitive login alert emails.
* **Session Revocation & Force Logout on Password Change**: Automatic `SecurityStamp` renewal, Duende grant revocation, security alert email, SignalR `ForceLogout` broadcast, and Redis `auth:revoked_before:{userId}` blacklist check at API Gateway to reject stale tokens.

### Customer Notifications Center (`/profile?tab=notifications`)
* **Master-Detail Notifications View**: 15-day query limit, category filtering (*All*, *Orders*, *Payments & Wallet*, *Security & Account*), contextual rich alerts with action buttons, and automated **Hangfire 30-day purge job** (`0 2 * * *`).

### Event-Driven Consumers
* `PaymentSucceededNotificationConsumer` / `PaymentFailedNotificationConsumer`
* `SubOrderCreatedNotificationConsumer` (notify seller)
* `SubOrderShippedNotificationConsumer` (notify buyer)
* `UserRegisteredNotificationConsumer` (welcome email)
* `ResetPasswordOtpNotificationConsumer` (OTP email)
* `NewDeviceLoginAlertNotificationConsumer` (security email on new device)
* `WithdrawalCompletedNotificationConsumer` (payout confirmation + proof image)
* `UserPasswordChangedNotificationConsumer` (security email + SignalR ForceLogout)

---

## 🔍 Native Full-Text Search & Explore Page
* **PostgreSQL Native Full-Text Search**: `to_tsvector` and `websearch_to_tsquery` for Vietnamese text search.
* **Autocomplete Search Suggestions**: Real-time search keyword suggestions via `/api/products/search-suggestions`.
* **Explore Products Page (`/explore`)**: 2-column layout with 1-5 star ratings filter, single-choice sort criteria (Newest, Price asc/desc, Best Seller), and keyword title header.

---

# 📐 4. Architectural Standards

## Clean Architecture CQRS vs Service Layer Pattern

* **CQRS + MediatR Services (`Catalog.Api`, `Orders.Api`)**: Strict separation of Commands and Queries, dedicated Handler files, and feature-driven folder structures.
* **Service Layer Pattern Services (`Payments.Api`, `Sellers.Api`, `Shippings.Api`, `Identity.Api`, `Cart.Api`, `Notifications.Api`)**: 0% MediatR, direct interface dependency injection (`Models/Interfaces/I[Name]Service.cs`), and centralized service implementations (`Services/`).

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
* Docker Desktop

Infrastructure Components:
* PostgreSQL
* MySQL
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

# 📄 License

This project is developed for learning, portfolio, and enterprise-scale ecommerce architecture experimentation.
