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

# ✨ 3. Implemented Business Capabilities

## 🏬 Seller Center

### KYC Verification

* National ID verification with front/back image upload.
* Approval workflow: Draft → Submitted → Approved / Rejected.
* Admin KYC management panel (`/admin/kyc`) with approve/reject actions and rejection reasons.
### Shop Management

* Shop creation after successful KYC approval.
* Shop profile management (name, description, logo, address).
* **Streamlined Pickup Address**: Normalized location architecture using clean numeric identifiers (`ProvinceId`, `DistrictId`, `WardId`, `AddressLine`) adhering to `Identity.Api` standards and eliminating redundant text columns.
* Follow / Unfollow shops (Customer) & Follower Management: Database-backed follow tracking in `FollowedShops`, follower count badge, shop followers query endpoint (`GET /api/shop/{shopId}/followers`) with date filtering and pagination, customer order history navigation without modal, and redesigned modern follow button.

### Seller Wallet

* Wallet activation.
* Bank account management (add, update).
* Transaction history.
* Withdrawal requests with admin approval workflow.

---

## 🛍️ Product Catalog & Shopping Cart

### Product Management

* Product creation with rich description.
* **Multi-tier product variant matrix**:
  * Visual matrix table with Shopee/TikTok Shop-style grouping (vertical row merging and clear classification dividers).
  * Smooth HTML5 drag-and-drop reordering for option values and specification attributes with real-time Cartesian variant sync.
  * Missing variant generation: Auto-detects omitted combinations with 1-click batch restoration modal.
  * Variant capacity limit: Strict 60-variant cap enforced across frontend and backend.
  * Bulk updates with quick-apply controls (price, stock, SKU) and promotional sale pricing.
* Product activation/deactivation & deletion with gRPC active orders validation (`CheckProductHasActiveSubOrders` from `Orders.Api`), preventing permanent deletion or deactivation while sub-orders are still in active/in-flight status.
* Multi-tenant shop ownership validation: Strictly verifies seller ownership via `Sellers.Api` gRPC for all product commands and queries (`GetMyProducts`, `UpdateProduct`, `ToggleStatus`, `DeleteProduct`, variant updates).
* Snowflake 64-bit ID serialization: All `long`/`long?` IDs are serialized to JSON strings in `Catalog.Api` to eliminate JavaScript floating-point precision loss ($2^{53} - 1$ limit) on the frontend.
* Customer Product Detail UX:
  * Interactive Modal Portal (`z-[10000]`) notifications when a product is non-existent/deleted or temporarily inactive, with warning banner for shop owners previewing their inactive products.
  * Single-line responsive price display (`whitespace-nowrap`) showing min-max discount price and percentage range (`-min% ~ -max%`) without layout shifting.
  * Real-time multi-tier combination availability checking: dynamically dims, strikes through, and disables options (`opacity-40 cursor-not-allowed pointer-events-none line-through`) that have zero stock or no matching combination.
  * Option 2 (tierIndex > 0) thumbnail suppression: excludes image tags for tier 2 values to ensure a clean layout.
* Shipping dimensions and weight configuration: Integrated into basic info management with standard parcel measurements in whole integers (`int`: weight in grams, length, width, height in cm) complying with GHN logistics requirements and eliminating floating-point precision artifacts.
* Granular deletion policies & controlled deletion workflow:
  * Zero silent soft-deletes: Variant updates strictly add or edit combinations without accidental cascade deletions.
  * ProductVariant: Verified via gRPC `CheckVariantOrders` from `Orders.Api`. Hard-deleted if no orders exist, blocked with conflict error if active orders exist, and soft-deleted if only historical orders exist.
  * ProductOption & ProductOptionValue: Guarded against deletion if referenced by any active variant. Endpoints: `DELETE /api/v1/catalog/products/{productId}/options/{optionId}` and `DELETE .../values/{valueId}`.
  * Seller UX: `IdHighlightBadge` with emerald highlight, dotted underline, tooltip hover ID & copy button for DB-persisted variants/options/values; non-intrusive switch confirmation modal on save with "Do not show again" preference.
* Tab dirty tracking & safe discard modal:
  * Independent dirty tracking across "Thông tin cơ bản" and "Biến thể" tabs with red `*` indicators.
  * Save button dynamically disabled when the currently active tab has no unsaved modifications.
  * Safety discard confirmation modal (`DiscardChangesModal`) rendered via Portal `z-[10000]` when attempting to cancel with unsaved changes.
* Specification attribute validation: Strict validation on both FE and BE ensuring every specification attribute contains non-empty key and value.
* Price range indexing (`Price` & `MaxPrice`) for min/max price range filtering.
* Native `jsonb` attributes storage with PostgreSQL GIN index (`jsonb_path_ops`).
* PostgreSQL Trigram (`pg_trgm`) & `unaccent` for accent-insensitive typo-tolerant search.

### 🌳 Hierarchical Category Tree (2 Levels, 129 Categories)

* **E-Commerce Taxonomy**: 19 root categories (Điện Thoại & Máy Tính Bảng, Máy Tính & Laptop, Thiết Bị Điện Tử, Thời Trang Nam, Thời Trang Nữ, Mẹ & Bé, Nhà Cửa & Đời Sống...) and 110 specialized level-2 subcategories (129 categories total).
* **Automated Data Seeding & Fallback**: Seeded via `CatalogCategorySeedData.cs` and `seed_categories.sql` with high-resolution Unsplash CDN icons.
* **Dynamic Product Classification**: Automatic categorization mapper (`MatchCategoryByProductName`) mapping all 180 existing products to matching level-2 subcategories with 0 orphaned items.
* **Redis Tree Caching**: Centralized Redis key `catalog:categories:tree` for instant sub-millisecond frontend navigation.

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

### Vouchers & Promotion Management

* **Voucher Code Uniqueness**: Enforced with PostgreSQL unique constraint `IX_Vouchers_Code` on `Voucher.Code` in `OrderDb`.
* **Double-Submission Protection**: Frontend request debouncing and button disablement preventing accidental duplicate voucher creation.
* **Scope-based Vouchers**: Platform-wide and shop-specific vouchers with minimum order value and usage limits.

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
* MoMo QR Payment (Sandbox) - Configurable minimum order threshold (`MinAmount`).
* VNPay (Sandbox) - Configurable minimum order threshold (`MinAmount`).
* Cash On Delivery (COD) - Flexible zero-threshold payment.

Data Architecture & Dynamic Thresholds:
* **Configurable Minimum Order Amount**: `MinAmount` integrated into `PaymentMethod` entity, configurable per payment method in Admin Dashboard.
* **Smart Frontend Feedback**: Methods below the order threshold are gracefully dimmed with clear badges and alerts, automatically falling back to eligible methods.
* **Backend Validation**: Dynamic order amount verification in `Payments.Api` before gateway dispatch, with instant stock and voucher compensation on payment failure.
* Payment webhooks automatically trigger status transitions via MassTransit events.

### Refund Workflow

* Buyer submits refund request with evidence media.
* Seller approves or rejects refund.
* Automatic refund balance restoration and stock release via Saga orchestration.

---

## 🚚 Shipping & Logistics

### GHN Integration

* Province/District/Ward synchronization (cron job).
* Multi-tier location caching: L1 in-memory + L2 Redis (24-hour TTL) with resilient database fallback.
* Shipping fee calculation (batch support).
* Automatic shipment creation (waybill).
* Shipment tracking via webhooks with sequential transition enforcement (`ReadyToPick` → `InTransit` → `Delivered`).
* Streamlined 6-status lifecycle: `ReadyToPick` (1), `InTransit` (2), `Delivered` (3), `Returned` (4), `Cancelled` (5), `Failed` (6).

### Delivery Workflow

```text
ReadyToPick (Chờ lấy hàng) → InTransit (Đang vận chuyển) → Delivered (Giao hàng thành công)
                                                                 ↓
                                                       ShipmentDeliveredEvent
                                                                 ↓
                                             Orders Service (SubOrder Delivered)
                                                                 ↓
                                             SellerRevenueConsumer (Wallet Credit)
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

## 🤖 Smart Recommendations & View Analytics

### Recommendation Engine (`Recommendations.Api`)
* **Service Layer Architecture**: Independent microservice running on port REST 5090 / gRPC 5091 with zero inter-service gRPC latency during queries.
* **Event-Driven Data Materialization**: Real-time sync via 8 MassTransit event consumers (`ProductCreated`, `ProductUpdated`, `ProductDeleted`, `ProductStatusChanged`, `ProductReviewCreated`, `SubOrderCompleted`, `WishlistToggled`, `CategoryTreeSync`).
* **On-Demand Synchronization**: `POST /api/recommendations/sync` endpoint and `sync_recommendations.sh` PostgreSQL stream script for on-demand synchronization of all 129 categories and 180 products from `CatalogDb` to `RecommendationDb`.
* **Content-Based Similarity**: Multi-factor similarity scoring (Category 35%, Shop 10%, Price Proximity 20%, Attribute Jaccard 20%, Popularity Boost 15%) for Product Detail pages (`GET /api/recommendations/similar/{productId}`).
* **Personalized Hybrid Feed**: Customer-specific feed weighting purchase history (40%), wishlists (20%), and 30-day views (25%) with cold-start fallback (`GET /api/recommendations/for-you?page=1`).
* **Real-time Trending**: Live trending product scoring combining 24-hour views (x1), 7-day purchases (x5), 7-day wishlist adds (x2), and review ratings (`GET /api/recommendations/trending?page=1`).
* **Anti-Spam View Tracking**: Endpoint `POST /api/product-views` with 30-minute Redis throttle per user/session, capturing page dwell time on unmount.
* **Performance & Scalability Optimization**:
  - **Fixed 18-Item Progressive Pagination**: Fixed payload chunks (18 items per page, ~2.5KB fixed payload), capped at 6 pages (108 items max, exactly 5 "Xem thêm" clicks) to avoid client memory and network bloat.
  - **Precomputed Candidate Pool Caching**:
    - `page = 1`: Always computes fresh candidate pool from database and updates Redis (`reco:pool:for-you:{id}` TTL 2h, `reco:pool:trending` TTL 1h), returning the first 18 items.
    - `page >= 2`: Slices `.Skip().Take()` directly from Redis pool in ~1–2ms without re-querying database or recalculating scores.
    - **Fault-Tolerant Fallback**: Gracefully re-generates pool if Redis is restarted or evicted during user session.
* **Frontend ACO Integration & Rich UX**:
  - **Landing Page Reveal & Viewport Lazy Loading**:
    - `BestSellersSection`: Golden Championship Cup `Trophy` icon (`fill-amber-400 text-amber-500`) + badge *"Top Bán Chạy"*, with Framer Motion `motion.section` scroll-reveal animation.
    - `InterestedProductsSection`: Escalating Trend Chart `TrendingUp` icon (`text-rose-500 stroke-[2.5]`) + badge *"Trending 24h"*, lazy viewport loading triggered at `margin: "-40px"`.
    - `TodayRecommendationsSection`: Smart AI `Sparkles` icon, lazy viewport loading at `margin: "-40px"`, persistent shimmer skeleton grid via `isWaitingForFetch = !isInView || isLoading` eliminating empty state flickering.
  - **Product Detail Page**: `RelatedProducts` (`useSimilarProductsQuery`) and automated view duration tracking (`useTrackProductViewMutation`).

---

## 📊 Financial Analytics & Business Intelligence (`Analytics.Api`)

### Real-Time Financial & Revenue Materialization
* **Event-Driven Metric Aggregation**: Listens to `SubOrderCompletedEvent` and `SubOrderStatusChangedEvent` via MassTransit to asynchronously record transactional metrics into pre-aggregated read models (`DailyPlatformRevenues`, `DailyShopRevenues`, `ShopProductStats`).
* **Marketplace Financial Accounting**:
  * **GMV (Gross Merchandise Value)**: Tracks the total monetary volume of all completed marketplace transactions.
  * **Gross Platform Commission**: Accurately accounts for marketplace service fees earned per order based on snapshotted commission rates.
  * **Voucher Subsidies & Net Platform Profit**: Tracks platform voucher expenditure to compute true net marketplace earnings.
  * **Seller Net Payouts**: Clear reconciliation between gross transaction values, commission deductions, and net seller earnings.
* **Single-Roundtrip High-Performance Read Models**: Overview endpoints utilize consolidated database aggregations to compute multi-metric financial summaries in a single round-trip, minimizing I/O latency under heavy dashboard traffic.

### Seller & Admin Dashboards
* **Seller Center Analytics (`/seller/dashboard/revenue`)**:
  * Daily revenue and order trendline charts with preset filtering (Today, 3 days, 7 days, 30 days, Custom Year/Month).
  * Product-level performance breakdown: Revenue per product, units sold, and order volume rankings.
  * Order fulfillment status distribution and customer acquisition insights.
* **Platform Admin Overview (`/admin`)**:
  * High-level executive overview: Total registered shops, cumulative orders, gross commission, net revenue profit, and voucher subsidy burn.
  * Multi-period platform revenue timelines (7d / 30d) for ecosystem financial health monitoring.

---

## 🔔 Real-time Notifications, Chat & Email

### Real-time Messaging & Floating Chat
* **SignalR Customer ↔ Shop Chat Page (`/chat`)**: Fullscreen real-time communication between buyers and seller shops with chat history.
* **Floating Chat Bubble & Modal (`ChatBubbleButton` + `ChatMiniModal`)**: 2-column popup chat widget accessible across all customer and seller pages.
* **Media Presentation & Actions**: Physical gray stacked cards behind multi-image/video with tilt and fan-out effect, action bar (reply quote, download, delete/revoke) on hover. Mốc thời gian khi hover được hiển thị bên dưới tin nhắn thụt nhẹ từ mép đầu.
* **Facebook Messenger-Style Reply**: Hỗ trợ trả lời (Reply) tin nhắn với thanh xem trước trích dẫn nằm ở mép trên cùng của khung nhập liệu, thẻ quote hiển thị trực quan trong bong bóng tin nhắn và lưu trữ PostgreSQL (`ReplyToMessageId`, `ReplyToContent`, `ReplyToSenderName`).
* **Input Box & Attachments UX**: Ô nhập `textarea` tự động co giãn từ 1 đến 4 dòng không giật thanh cuộn, widget đính kèm tệp tin đa dạng (ảnh, video, tài liệu PDF/DOCX/ZIP) với thẻ ngang hiển thị tên tệp tin dài trước khi rút gọn.
* **Room Customization**: Custom theme colors and background styling per conversation (`ThemeColor`, `BackgroundColor`), đồng bộ màu sắc thẻ tin nhắn gửi và nhận.

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

# 📐 4. Architectural Standards

## Clean Architecture CQRS vs Service Layer Pattern

* **CQRS + MediatR Services (`Catalog.Api`, `Orders.Api`)**: Strict separation of Commands and Queries, dedicated Handler files, and feature-driven folder structures.
* **Service Layer Pattern Services (`Payments.Api`, `Sellers.Api`, `Shippings.Api`, `Identity.Api`, `Cart.Api`, `Notifications.Api`, `Recommendations.Api`)**: 0% MediatR, direct interface dependency injection (`Models/Interfaces/I[Name]Service.cs`), and centralized service implementations (`Services/`).

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

# 📚 Documentation & Guidelines

* [Git Commit Conventions](file:///home/vanmuzic/Projects/Ecommerce_Microservices/docs/COMMIT_CONVENTION.md) - Standardized commit formats, scopes, and Git workflows.
* [Migration & AWS Setup Guide](file:///home/vanmuzic/Projects/Ecommerce_Microservices/docs/MIGRATION_AND_AWS_SETUP_GUIDE.md) - Database migrations and cloud setup guide.

---

# 📄 License

This project is developed for learning, portfolio, and enterprise-scale ecommerce architecture experimentation.
