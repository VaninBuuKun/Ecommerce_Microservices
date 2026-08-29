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
        ├──► Catalog.Api      (REST 5001 / gRPC 5002) ──► MySQL
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
| **Catalog.Api**       | 5001 | 5002 | MySQL      | Product Catalog, SKU Variants, Inventory, Ratings & Reviews |
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

---

## 🛒 Checkout, Orders & Payments

### Checkout Calculation

* Product subtotal.
* Platform vouchers.
* Shop vouchers.
* Shipping fee calculation via GHN gRPC integration.
* Redis checkout session for data persistence.

### Multi-Shop Orders

A single checkout is automatically split into multiple SubOrders based on seller shop ownership.

### Order Lifecycle

```text
AwaitingPayment → AwaitingConfirmation → Processing → PackageReady → Shipping → Delivered → Completed
                                                                                     or
                                                                              Cancelled / Refunded
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
* Automatic refund processing via event consumers.

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

* Products overview
* Order management (pagination, filtering, keyword search)
* Shipment tracking
* Refund management
* Category management (hierarchical tree)
* User management (lock/unlock, role assignment)
* Shop management (view, ban/suspend)
* KYC approval workflow
* Voucher management (CRUD)
* Wallet & Withdrawal management (approve/reject/complete)

### Available Roles

* Admin
* Manager
* Staff
* User

---

## 🔔 Real-time Notifications & Chat
* SignalR Hub for real-time push.
* **SignalR Customer ↔ Shop Chat Page (`/chat`)**: Fullscreen real-time messaging between Customers and Sellers with chat history.
* **MailKit / MimeKit Email System**: HTML email notifications (Order confirmations, Password reset).
* Event-driven consumers:
  * Payment succeeded / failed
  * New order created (notify seller)
  * Order shipped (notify buyer)

---

## 🔍 Native Full-Text Search & Explore Page
* **PostgreSQL Native Full-Text Search**: `to_tsvector` and `websearch_to_tsquery` for Vietnamese text search.
* **Autocomplete Search Suggestions**: Real-time search keyword suggestions via `/api/products/search-suggestions`.
* **Explore Products Page (`/explore`)**: 2-column layout with 1-5 star ratings filter, single-choice sort criteria (Newest, Price asc/desc, Best Seller), and keyword title header.

---

# 📐 4. Architectural Standards

## CQRS + Clean Architecture

Commands and Queries are fully separated with dedicated handler files.

## gRPC Presentation Adapter Pattern

gRPC services only act as transport adapters, delegating to MediatR handlers.

## gRPC Client Abstraction

Inter-service communication wrapped behind service abstractions with `RpcException` → `Result<T>` mapping.

## Unit of Work & Repository Pattern

Database access abstracted through `IEfUnitOfWork` and `IGenericEfRepository<T>`.

## EfDbContextBase — Automatic Date Tracking

`SaveChangesAsync()` automatically populates `CreatedDate` and `LastModifiedDate` for all `IDateTracking` entities.

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
