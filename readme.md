# 🛒 Multi-Vendor Ecommerce Microservices Platform (don't develop new features)

[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-MassTransit-FF6600?logo=rabbitmq&logoColor=white)](https://masstransit.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

An enterprise-grade marketplace ecommerce platform engineered with **.NET 9 Microservices**, **Event-Driven Architecture (MassTransit Saga + Outbox)**, **gRPC**, **YARP Gateway**, and a modern **React 19** frontend.

---

## 🏛️ System Architecture

```text
                     [ React 19 Client ]
                              │ (HTTP/REST)
                              ▼
           [ YARP API Gateway ] ── (Rate Limiting, CORS, Token Revocation)
                              │
   ┌───────────┬──────────────┼──────────────┬─────────────┐
   ▼           ▼              ▼              ▼             ▼
Catalog       Cart          Orders        Payments      Shippings
 (5001)      (5004)         (5007)         (5052)        (5070)
   │           │              │              │             │
PostgreSQL   Redis          PostgreSQL    PostgreSQL    PostgreSQL
   │           │              │              │             │
   └───────────┴──────────────┼──────────────┴─────────────┘
                              │ (MassTransit + RabbitMQ / gRPC)
   ┌───────────┬──────────────┼──────────────┬─────────────┐
   ▼           ▼              ▼              ▼             ▼
Sellers     Identity    Notifications  Recommendations  Analytics
 (5042)      (5027)         (5080)         (5090)        (5095)
   │           │              │              │             │
PostgreSQL   PostgreSQL     PostgreSQL    PostgreSQL    PostgreSQL
```

* **Synchronous Communication**: High-throughput **gRPC** via centralized Protocol Buffers (`BuildingBlocks.Grpc`).
* **Asynchronous Communication**: Event-driven **MassTransit + RabbitMQ** with Saga State Machine & Transactional Outbox.

---

## 🛠️ Microservices Ecosystem

| Service | REST / gRPC | Database | Core Responsibilities |
| :--- | :---: | :---: | :--- |
| **`Catalog.Api`** | `5001` / `5002` | PostgreSQL | Product management, SKU variant matrix, inventory reserve/release, reviews, search by trigram and gin index. |
| **`Cart.Api`** | `5004` / `5005` | Redis | multi-shop grouping, stock validation. |
| **`Orders.Api`** | `5007` / `5008` | PostgreSQL | Order lifecycle, multi-shop suborders, data snapshots, vouchers, refunds. |
| **`Payments.Api`** | `5052` / `5053` | PostgreSQL | Payment gateways (MoMo QR, VNPay, COD), seller wallets, withdrawals. |
| **`Shippings.Api`** | `5070` / `5071` | PostgreSQL | Giao Hàng Nhanh (GHN) sync, multi-tier fee calculation, carrier tracking. |
| **`Sellers.Api`** | `5042` / `5043` | PostgreSQL | Seller KYC onboarding, shop management, pickup addresses, followers. |
| **`Identity.Api`** | `5027` / `5028` | PostgreSQL | OAuth2 / OIDC (Duende), persistent tokens, RBAC, user addresses. |
| **`Notifications.Api`**| `5080` / `5081` | PostgreSQL | Real-time SignalR hub, integrated with Mailtrap for Dev sandbox. |
| **`Recommendations.Api`**| `5090` / `5091` | PostgreSQL | Content-based filtering recommendations (For-You, Trending 24h, Similar Products). |
| **`Analytics.Api`** | `5095` / `5096` | PostgreSQL | Analytics for platform and shop, category revenue, costs, top 30 product performance. |

---

## ✨ Core Highlights & Capabilities

### 🛍️ Customer Experience
* **Product Discovery**: personalized **For You** feed scored by top category, sold rate, rating average of product **Trending 24h** scored by real-time views/orders, and **Similar Products** proximity matching.
**Smart Search**: Typo-tolerant search powered by PostgreSQL Trigram (pg_trgm) and GIN indexes, paired with code-driven regex intent parsing for natural language filters (extracting price ranges, sorting by best-selling or newest, and multi-tier variant selection).
* **Unified Checkout**: Automated GHN logistics fee calculation, platform + shop vouchers, multi payment methods (COD, MoMo, VNPay), idempotent order placement.
* **Live Engagement**: Real-time customer ↔ seller chat with multimedia attachments, order timeline tracking,refund requests.

### 🏬 Seller Operations
* **Catalog & Inventory**: variant matrix builder, stock/price management, conflict-aware status safeguards.
* **Order Fulfillment**: 3-step pipeline (Confirm → Pack → Handover GHN) with automated waybill generation.
* **Finance & Wallets**: Real-time wallet tracking net sales proceeds (excluding shipping fees), withdrawals.
* **Analytics**: Revenue spline charts, real fulfillment distribution (Completed, Cancelled, Refunded), top 30 product rankings.

### 🛡️ Platform Governance
* **Financial Settlements**: Dedicated 3rd-party logistics (GHN) shipping settlement tracking isolated from platform GMV and net profit.
* **Seller & Catalog Oversight**: Dual-photo seller KYC verification 2-level category tree governance.
* **Security & RBAC**: Granular role-based authorization (`Admin`, `User`), instant session revocation.
* **4-Mode System Analytics**: Dedicated platform-wide GMV & net margin oversight, category share analysis with client-side cache resolution, shop audits, and deep-dive product diagnostics.

---

## 📐 Engineering & Architectural Highlights

* **Clean Architecture & CQRS**: Strict command/query separation with MediatR across core transactional services (`Catalog`, `Orders`).
* **Distributed Sagas & Outbox**: MassTransit State Machine orchestrating multi-service order checkout with eventual consistency and zero message loss.
* **Gateway Token Revocation**: YARP reverse proxy with `TokenRevocationMiddleware` executing $O(1)$ Redis lookups to reject revoked sessions immediately.
* **Cascading Configuration**: Secure 2-layer config (`appsettings.json` skeleton + git-ignored `appsettings.Developer.json`) merged automatically at boot.
* **Frontend ACO Architecture**: React 19 + TypeScript + Vite + Tailwind CSS v4 structured into **Apps**, **Components**, and isolated **Domains**.

---

## 🚀 Quick Start

### 1. Prerequisites
* **.NET 9 SDK** & **Node.js 20+**
* **Docker & Docker Compose**

### 2. Start Infrastructure
```bash
docker compose up -d
```

### 3. Build & Run Services
```bash
# Build all backend microservices
dotnet build Microservices.sln

# Run frontend client
cd frontend-web
npm install
npm run dev
```
> Web Application: `http://localhost:5173` | YARP Gateway: `http://localhost:5000`

---

## 🐳 Production Deployment

Deploy the entire production stack (Gateway, 10 microservices, DBs, RabbitMQ, Redis) via Docker Compose:
```bash
cd src
cp .env.example .env
docker compose -f docker-compose.prod.yaml --env-file .env up -d
```

---

## 📚 Documentation & Guidelines

* [Git Commit Conventions](docs/COMMIT_CONVENTION.md) - Standardized Conventional Commits & Git workflow.
* [Migration & Deployment Guide](docs/MIGRATION_AND_AWS_SETUP_GUIDE.md) - Database migrations and infrastructure guide.

---

## 📄 License
MIT License. Developed for learning, portfolio, and enterprise-scale microservices architecture experimentation.
