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
        └──► Identity.Api     (REST 5027 / gRPC 5028) ──► PostgreSQL

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
| **Sellers.Api**       | 5042 | 5043 | PostgreSQL | KYC Verification, Shop Management, Pickup Addresses         |
| **Payments.Api**      | 5052 | 5053 | PostgreSQL | VNPay, MoMo, COD, Seller Wallets, Withdrawals               |
| **Shippings.Api**     | 5070 | 5071 | PostgreSQL | GHN Integration, Shipping Rates, Delivery Tracking          |
| **Notifications.Api** | 5080 | -    | PostgreSQL      | SignalR Realtime Notifications & Chat                       |

---

# ✨ 3. Implemented Business Capabilities

## 🏬 Seller Center

### KYC Verification

* National ID verification with front/back image upload.
* Approval workflow:

  * Draft
  * Submitted
  * Approved
  * Rejected

### Shop Management

* Shop creation after successful KYC approval.
* Shop profile management.
* Pickup address management integrated with GHN.

### Seller Wallet

* Wallet activation.
* Bank account linking.
* Transaction history.
* Withdrawal requests.

---

## 🛍️ Product Catalog & Shopping Cart

### Product Management

* Product variants management.
* Product options and attributes.
* Shipping dimensions and weight configuration.
* Product activation/deactivation.

### Ratings & Reviews

* Star ratings.
* Product reviews and comments.
* Media uploads.
* Review eligibility validation through gRPC:

  * Number of reviews cannot exceed completed purchases.

### Redis Shopping Cart

* Add/update/remove products.
* Product selection for checkout.
* Automatic grouping by seller shop.

---

## 🛒 Checkout, Orders & Payments

### Checkout Calculation

* Product subtotal.
* Platform vouchers.
* Shop vouchers.
* Shipping fee calculation via GHN gRPC integration.

### Multi-Shop Orders

A single checkout can be automatically split into multiple SubOrders based on seller ownership.

### Order Lifecycle

```text
AwaitingPayment
    ↓
AwaitingConfirmation
    ↓
Processing
    ↓
PackageReady
    ↓
Shipping
    ↓
Delivered
    ↓
Completed

or

Cancelled
Refunded
```

### Payment Integration

Supported payment methods:

* MoMo QR Payment
* VNPay
* Cash On Delivery (COD)

Payment webhooks automatically trigger:

```text
PaymentSucceededEvent
        ↓
Orders Service
        ↓
AwaitingConfirmation
```

### Refund Workflow

* Buyer submits refund request.
* Seller approves or rejects request.
* Automatic refund processing through event consumers.

---

## 🚚 Shipping & Logistics

### GHN Integration

Features:

* Province/District/Ward synchronization.
* Shipping fee calculation.
* Automatic shipment creation.
* Shipment tracking.

### Delivery Workflow

```text
GHN Delivered
        ↓
ShipmentDeliveredEvent
        ↓
Orders Service
        ↓
SubOrder Delivered
        ↓
SellerRevenueConsumer
        ↓
Seller Wallet Credit
```

---

## 🛡️ Administration & Governance

### Order Management

* Global SubOrder management.
* Pagination and filtering.
* Keyword search.
* Detailed order inspection.

### Seller Management

* Shop listing.
* KYC approval workflow.
* Shop ban/unban.

### User Management

* Account lock/unlock.
* Role assignment.

Available roles:

* Admin
* Manager
* Staff
* User

### Voucher & Withdrawal Management

* Platform-wide vouchers.
* Withdrawal approval process.

---

# 📐 4. Architectural Standards

## CQRS + Clean Architecture

Commands and Queries are fully separated.

```text
CreateOrderCommand.cs
CreateOrderCommandHandler.cs

GetOrderQuery.cs
GetOrderQueryHandler.cs
```

---

## gRPC Presentation Adapter Pattern

gRPC services only act as transport adapters.

```csharp
await sender.Send(command);
```

Business logic remains inside the Application Layer.

---

## gRPC Client Abstraction

Inter-service communication is wrapped behind service abstractions.

Examples:

```text
ProductClientService
SellerClientService
ShippingClientService
```

Benefits:

* Centralized error handling.
* RpcException wrapping.
* Consistent Result<T> responses.

---

## Unit of Work & Repository Pattern

Database access is abstracted through:

```text
IEfUnitOfWork
IGenericEfRepository<T>
```

Benefits:

* Transaction management.
* Consistent repository implementation.
* Improved testability.

---

## MassTransit Saga & Transactional Outbox

Used to guarantee eventual consistency between:

```text
Database Transaction
+
RabbitMQ Message Publication
```

Benefits:

* Reliable event delivery.
* Distributed transaction orchestration.
* Recovery from partial failures.

---

## Frontend Architecture (React 19)

Frontend follows a three-layer architecture:

```text
apps/
domains/
shared/
```

### apps/

Complete application pages grouped by business role:

* User
* Seller
* Admin
* Authentication

### domains/

Business domain modules:

* API integrations
* Hooks
* Types
* Components

### shared/

Reusable utilities and common components.

### UI Standards

* Modals rendered using:

```tsx
createPortal(..., document.body)
```

* Centralized API error handling based on:

  * HTTP Status Codes
  * Result.ErrorCode

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

---

## Start Infrastructure

```bash
docker compose up -d
```

---

## Run Backend Services

```bash
dotnet build Microservices.sln
```

Run services from:

* Visual Studio
* JetBrains Rider
* .NET CLI

---

## Run Frontend

```bash
cd frontend-web

npm install

npm run dev
```

Application URL:

```text
http://localhost:5173
```

---

# 🐳 Production Deployment

Deploy the complete stack on a VPS using Docker Compose.

```bash
# Navigate to source directory
cd src

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start all services
docker compose \
  -f docker-compose.prod.yaml \
  --env-file .env \
  up -d
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

* .NET 9
* ASP.NET Core
* MediatR
* FluentValidation
* MassTransit
* gRPC
* Entity Framework Core

### Databases

* PostgreSQL
* MySQL
* Redis

### Messaging

* RabbitMQ
* MassTransit Saga State Machine

### Frontend

* React 19
* TypeScript
* Zustand
* TanStack Query
* React Hook Form
* Zod

### Infrastructure

* Docker
* Docker Compose
* YARP API Gateway

### Observability

* OpenTelemetry
* Grafana
* Loki
* Tempo

---

# 📄 License

This project is developed for learning, portfolio, and enterprise-scale ecommerce architecture experimentation.
