# 01. Business Capabilities & Implemented Features

This document provides a detailed breakdown of all implemented backend APIs, gRPC endpoints, and frontend features across the 7 microservices.

## 1. Catalog Service (PostgreSQL)
- **Entities**: Product, ProductOption, ProductOptionValue, ProductVariant, Category, ProductReview, Wishlist.
- **Commands**:
  - `CreateProductCommandHandler`, `UpdateProductCommandHandler`, `DeleteProductCommandHandler`
  - `ToggleProductStatusCommand`, `InitVariantsCommandHandler`, `BulkUpdateVariantsCommandHandler`
  - `ReserveStocksCommandHandler` (gRPC), `ReleaseStocksCommandHandler` (gRPC)
  - `CreateCategoryCommandHandler`, `UpdateCategoryCommandHandler`, `DeleteCategoryCommandHandler`
  - `CreateProductReviewCommandHandler`
  - `ToggleWishlistCommandHandler` (`POST /api/wishlists/toggle/{productId}`)
- **Queries**:
  - `GetProductsQueryHandler`, `GetProductByIdQuery`, `GetMyProductsQueryHandler`
  - `GetVariantsByIdsCommandHandler`, `GetVariantByIdQueryHandler`
  - `GetCategoriesQueryHandler` (Cached in Redis `catalog:categories:tree`)
  - `GetProductReviewsQuery`, `GetProductReviewsSummaryQuery`
  - `GetMyWishlistQueryHandler` (`GET /api/wishlists`)
- **Seeding**:
  - `CatalogCategorySeedData` & `CatalogDataSeeder`: 19 Root Categories & 110 Subcategories (129 total) with Unsplash CDN icons, automatic level-2 category assignment for products.

## 2. Cart Service (Redis)
- **Session-less Redis Cart**: Add/Update/Remove cart items, toggle `IsSelected`, group items by `ShopId`.
- **gRPC Server**: `CartGrpcServer` exposes cart item queries for Order Checkout.

## 3. Order Service (PostgreSQL)
- **Entities**: Order, SubOrder, SubOrderItem, Voucher, RefundRequest, PlatformCommissionConfig.
- **Financial Snapshot Architecture**:
  - `PlatformCommissionConfig` (RatePercentage, UpdatedByUserId) is maintained directly in `OrdersDb` for fast 0ms checkout lookups without inter-service network calls.
  - `SubOrder` snapshots `CommissionRate` (decimal) and `CommissionFee` (long) at creation time, with computed property `NetRevenue => GrandTotal - CommissionFee`.
  - `SubOrder` snapshots `ShopName` (string) and `ShopLogoUrl` (string?) at checkout creation time from `CheckoutSession` / Sellers service, eliminating runtime gRPC hops on queries.
  - `SubOrderSagaState` in MassTransit Saga stores snapshotted `CommissionRate` and `CommissionFee`.
  - `SubOrderCreatedEvent` & `SubOrderCompletedEvent` propagate `CommissionRate`, `CommissionFee`, and `NetRevenue` across services.
- **Commands**:
  - `CalOrderGrandTotalCommandHandler`: Calculates item prices, shop vouchers, platform vouchers, and GHN shipping fees. Snapshots `ShopNames` and `ShopLogoUrls` into Redis `CheckoutSession`.
  - `CreateOrderCommandHandler`: Reads active commission rate directly from local `PlatformCommissionConfig`, snapshots `ShopName` and `ShopLogoUrl` into `SubOrder`, calculates exact commission fee per sub-order, and publishes `SubOrderCreatedEvent` (zero gRPC latency).
  - `UpdatePlatformCommissionCommandHandler` (`PUT /api/admin/commission`)
  - `SellerConfirmSubOrderCommandHandler`, `SellerRejectSubOrderCommandHandler`, `SellerPackageReadyCommandHandler`
  - `CompleteSubOrderCommandHandler`: Emits `SubOrderCompletedEvent` with pre-calculated financial snapshot metrics.
  - `CancelSubOrderCommandHandler`
  - `CreateRefundCommandHandler`: Supports List<string> Medias for refund evidence images.
  - `ApproveRefundCommandHandler`, `RejectRefundCommandHandler`, `CancelRefundCommandHandler`
  - `CreateVoucherCommandHandler`, `UpdateVoucherCommandHandler` (Unique index on `Voucher.Code`)
- **Queries**:
  - `GetPlatformCommissionQueryHandler` (`GET /api/admin/commission`)
  - `GetOrderByIdQueryHandler`, `GetSubOrdersQuery`, `GetSubOrdersByShopQueryHandler`, `GetSubOrderDetailQueryHandler` (Exposes snapshotted `ShopName`, `ShopLogoUrl`, `CommissionRate`, `CommissionFee`, `NetRevenue` for Seller and Customer transparency)
  - `GetCompletedSubOrderCountForProductQueryHandler` (gRPC)
  - `GetVouchersQueryHandler`, `GetAvailableVouchersQueryHandler`
  - `GetMyRefundsQueryHandler`, `GetShopRefundsQueryHandler`

## 4. Sellers Service (PostgreSQL)
- **Entities**: SellerKyc, Shop, PickUpAddress (Streamlined to `ProvinceId`, `DistrictId`, `WardId` (long) and `AddressLine`), FollowedShop.
- **Commands**:
  - `RegisterKycCommandHandler`, `WithdrawKycDraftCommand`, `ApproveKycCommandHandler`
  - `CreateShopCommandHandler`, `UpdateShopCommandHandler`
  - `ActivateShopCommandHandler`, `SuspendShopCommandHandler`, `BanShopCommandHandler`
  - `ToggleFollowShopCommandHandler` / `ToggleFollowShopAsync` (`POST /api/shop/{shopId}/follow`)
  - `GetFollowedShopsAsync` (`GET /api/shop/followed`)
  - `CheckFollowStatusAsync` (`GET /api/shop/{shopId}/follow-status` [AllowAnonymous])
  - `GetShopFollowersAsync` (`GET /api/shop/{shopId}/followers` with pagination & `fromDate` filter)
  - `GetFollowersCountAsync` (`GET /api/shop/{shopId}/followers-count` [AllowAnonymous])
- **Queries**:
  - `GetMyKycQuery`, `GetMySellerProfileQuery`, `GetPublicShopByIdQuery`, `GetPublicShopsByOwnerIdQuery`
  - `GetAllShopsQueryHandler` (CQRS Query `GET /api/shop/all` for Admin with pagination, search & status filter)
  - `ValidateShopOwnerQueryHandler` (gRPC), `GetShopsByIdsQueryHandler` (gRPC), `GetShopShippingInfoQueryHandler` (gRPC)
- **Seeding**:
  - `SeedDataExtensions`: Seeds 13 Naruto-themed Shops (IDs 1-13) with realistic `WardId`/`DistrictId`/`ProvinceId` and 10 verified `SellerKyc` profiles.


## 5. Payments Service (PostgreSQL)
- **Entities**: Payment, PaymentMethod, Wallet, BankAccount, WalletTransaction, WithdrawalRequest.
- **Commands**:
  - `ProcessPayment`: Supports COD, Momo Sandbox (IPN Webhook), VNPay Sandbox.
  - `ActivateWallet`, `AddBankAccountRequest`
  - `CreateWithdrawal`, `CompleteWithdrawal`, `AdminRejectWithdrawal`
- **Queries & Consumers**:
  - `GetPaymentMethodByIdQueryHandler` (gRPC), `GetPaymentByOrderIdQueryHandler` (gRPC), `CheckShopWalletQueryHandler` (gRPC)
  - `SellerRevenueConsumer`: Uses pre-calculated snapshot `NetRevenue` and `CommissionFee` from `SubOrderCompletedEvent` to credit wallet and record ledger transactions without dynamic recalculation.
  - `RefundSubOrderConsumer`: Automatically refunds money to customer wallet/gateway on refund approval.

## 6. Shippings Service (PostgreSQL)
- **Entities**: Province, District, Ward, Shipment (6 states: `ReadyToPick=1`, `InTransit=2`, `Delivered=3`, `Returned=4`, `Cancelled=5`, `Failed=6`).
- **Features**:
  - `LocationSyncJob`: Cron job syncing GHN location hierarchy.
  - `CalculateBatchShippingFeeQueryHandler` (gRPC & REST): GHN API fee calculation.
  - `CreateShipmentConsumer`: MassTransit Consumer creating GHN waybills.
  - `WebhooksController`: Receives GHN status updates with sequential state transition enforcement.
  - `ShipmentsController`: `GET /api/shipments` for Admin shipment management.

## 7. Identity Service (PostgreSQL)
- OAuth2 / OIDC JWT Authentication, `UserAddresses` CRUD.
- **Custom Resource Owner Password Validator**: Validates `IsActive` (`account_disabled`), `IsLockedOutAsync` (`account_locked`), and invalid credentials with corresponding Gateway error responses.
- **Users & Roles Management**: `UsersController` (`POST /api/users` Admin Create User, `POST /api/users/{id}/lock` & `unlock` synced with `IsActive`, `GET /api/users/count` for fast user count query), `RolesController` (Full Role CRUD for Admin: `Admin`, `Manager`, `User`, `Staff`).
- **Cryptographic & Token Persistence Architecture**:
  - `DataProtection`: Persists key ring to `AppContext.BaseDirectory/dataprotection-keys` with fixed `SetApplicationName("EcommerceMicroservices")` so refresh token payloads in `PersistedGrants` can always be decrypted across service restarts.
  - `IdentityServer`: Persists signing credentials (`tempkey.jwk`) to `AppContext.BaseDirectory` with `PreserveNewest` MSBuild copy rule, preventing signing key regeneration and token invalidation on restarts.

## 8. Recommendations Service (PostgreSQL - Port REST 5090 / gRPC 5091)
- **Architecture**: Service Layer Pattern, Event-Driven Data Materialization (No gRPC calls during queries, 100% reading from local denormalized tables).
- **Entities**:
  - `MaterializedProduct` (ProductId, ShopId, CategoryId, Name, Description, Price, DiscountPrice, AttributesJson, Sold, AverageRating, ReviewCount, IsActive, LastSyncedAt)
  - `MaterializedCategory` (CategoryId, Name, ParentId, Level)
  - `ProductView` (Id, UserId, SessionId, ProductId, CategoryId, ShopId, DurationSeconds, ViewedAt)
  - `UserPurchaseHistory` (Id, UserId, ProductId, CategoryId, ShopId, Quantity, PurchasedAt)
  - `UserWishlistItem` (Id, UserId, ProductId, CategoryId, IsActive, ToggledAt)
- **Strategies & APIs**:
  - `GET /api/recommendations/similar/{productId}?limit=12`: Content-based similarity using weighted scoring (Same Category 0.35, Same Shop 0.10, Price Proximity 0.20, Attribute Overlap Jaccard 0.20, Popularity Boost 0.15). Cached in Redis (TTL 6h).
  - `GET /api/recommendations/for-you?page=1`: Personalized hybrid feed with fixed 18-item chunks (max 6 pages = 108 products, 5 clicks). Page 1 always computes fresh candidate pool from DB & saves snapshot to Redis (`reco:pool:for-you:{id}`, TTL 2h); Page 2..6 sliced from Redis pool in ~1-2ms.
  - `GET /api/recommendations/trending?page=1`: Real-time trending scored by 24h views (x1), 7d purchases (x5), 7d wishlist adds (x2), and review ratings. Fixed 18 items, max 6 pages. Page 1 computes pool & saves to Redis (`reco:pool:trending`, TTL 1h); Page 2..6 sliced from Redis pool.
  - `POST /api/recommendations/sync`: On-demand synchronization endpoint syncing categories and products directly from `CatalogDb` to `RecommendationDb`.
  - `POST /api/product-views`: Product view tracking with Redis 30-minute throttle per user/session to avoid spamming the DB.
  - `GET /api/product-views/{productId}/stats`: Aggregated view statistics (total, 24h, 7d).
- **Event Consumers (Materialization Pipeline)**:
  - `ProductCreatedConsumer`: Materializes newly created products from `ProductCreatedEvent`.
  - `ProductUpdatedConsumer`: Updates materialized product snapshots from `ProductUpdatedEvent`.
  - `ProductDeletedConsumer`: Deactivates deleted products from `ProductDeletedEvent`.
  - `ProductStatusChangedConsumer`: Syncs product active status from `ProductStatusChangedEvent`.
  - `ProductReviewCreatedConsumer`: Updates review rating and count from `ProductReviewCreatedEvent`.
  - `SubOrderCompletedConsumer`: Records customer purchase history and updates sold counters from `SubOrderCompletedEvent`.
  - `WishlistToggledConsumer`: Syncs user wishlist items from `WishlistToggledEvent`.
  - `CategorySyncConsumer`: Synchronizes hierarchical category tree from `CategoryTreeSyncEvent`.

## 9. Analytics Service (PostgreSQL - Port REST 5095 / gRPC 5096)
- **Architecture**: Service Layer Pattern, Event-Driven Data Materialization, local database `AnalyticsDb`.
- **Query Optimization (Consolidated Aggregations)**:
  - `AdminAnalyticsService.GetOverviewAsync`: Consolidated 6 separate database round-trips (`TotalOrders`, `PlatformRevenue`, `TotalGmv`, `NetPlatformRevenue`, `PlatformDiscountAmount`, and today's stat) into a single SQL aggregation query using `GroupBy(_ => 1)` with conditional sums (`CASE WHEN "Date" = @today THEN ...`). Reduced from 7 `await`s to 2 `await`s.
  - `SellerAnalyticsService.GetOverviewAsync`: Consolidated 3 separate queries on `DailyShopRevenues` (today's stat, month-to-date revenue, total orders) into a single SQL aggregation query using `GroupBy(_ => 1)`.
- **Entities**:
  - `DailyShopRevenue` (Id, ShopId, Date, Revenue [Net Payout], OrderCount, CompletedOrderCount, UpdatedDate)
  - `DailyPlatformRevenue` (Id, Date, TotalGmv, PlatformRevenue [Gross Commission], PlatformDiscountAmount, NetPlatformRevenue [Net Commission Profit], TotalOrders, UpdatedDate)
  - `ShopProductStats` (Id, ShopId, ProductId, ProductName, ThumbnailUrl, SoldQuantity, Revenue, UpdatedDate)
- **Financial Accounting & Revenue Calculation**:
  - Shipping fee is excluded from shop revenue and kept by platform to settle with 3rd-party logistics (GHN).
  - Shop net revenue is strictly calculated as `(SubTotal - SellerDiscount) - CommissionFee`.
  - Commission fee is computed on the actual shop merchandise value `SubTotal - SellerDiscount` (not grand total with shipping).
  - In `ShopProductStats`, sub-order net revenue is allocated proportionally among item line items based on `UnitPrice * Quantity`.
- **Consumers**:
  - `SubOrderCompletedAnalyticsConsumer`: Materializes accurate e-commerce accounting metrics (splits GMV, Gross Platform Commission, Voucher Burn, and Net Shop Revenue) from `SubOrderCompletedEvent`. Snapshots `ProductName` and `ThumbnailUrl` into `ShopProductStats`.
  - `SubOrderStatusChangedAnalyticsConsumer`: Listens to order status updates.
- **Controllers & APIs**:
  - `SellerAnalyticsController` (`/api/analytics/shops/{shopId}`):
    - `GET /overview`: Today's revenue, month's revenue, order counts, product counts, average rating.
    - `GET /revenue-chart?period=7d|30d&year=&month=`: Continuous daily revenue timeline points with period, specific year (12-month aggregation), and specific month (daily points) filtering.
    - `GET /top-products?limit=25`: Top products sorted by sold quantity and revenue with `ProductName` and `ThumbnailUrl`.
  - `AdminAnalyticsController` (`/api/analytics/admin`):
    - `GET /overview`: Total shops, total orders, platform revenue, GMV, net platform revenue, platform voucher burn, today's new orders.
    - `GET /revenue-chart?period=7d|30d&year=&month=`: Continuous daily platform revenue timeline points with GMV, Net metrics, and year/month drilldown support.
    - `GET /top-products?limit=25`: Platform-wide top products aggregated across all shops with `ProductName` and `ThumbnailUrl`.

## 10. Notifications Service (PostgreSQL - Port REST 5080 / gRPC 5081)
- Email notifications, SMTP, system alerts, real-time SignalR Hub.

## 11. Frontend ACO Architecture (Apps - Components - Domains)
- **Directory Structure**:
  - `src/apps/`: Entry pages for customer (`/`, `/cart`, `/checkout`, `/products/:id`), seller (`/seller/select-shop`, `/seller/:shopId/dashboard`), auth (`/login`, `/register`), admin (`/admin`).
  - `src/domains/`: Domain logic grouped by boundary (`auth`, `catalog`, `cart`, `order`, `seller`, `kyc`, `address`, `wallet`, `shipping`, `admin`). Contains `api/`, `hooks/`, `stores/`, `types/`, `components/`.
  - `src/shared/`: Cross-cutting utilities, helpers (`formatPrice`, `formatStock`, `authHelper`).
- **Frontend Auth Resilience & Silent Refresh Flow**:
  - `AuthProvider.tsx` & `tokenRefresh.ts`: Automatic **Silent Refresh** (both reactive on 401 via Axios interceptor with Singleton Promise mutex lock and proactive 55-minute timer + tab focus/visibility wake-up sync). Exchanges the 7-day HttpOnly `refresh_token` cookie for a fresh access token seamlessly, protecting IdentityServer Token Rotation without prematurely logging out the user. Route guards (`RequireAuth`, `RequireAdmin`) never destroy sessions client-side on expired tokens.
  - **Network Error & Server Restart Protection**: Replaces naive `currentUserQuery.isError` session clearing with strict `status === 401` checking. Server reboots, temporary connection drops, and 5xx errors no longer log the user out.
  - `axiosInstance.ts`: Refresh promise error handler only wipes state on HTTP 401/400 rejections from the auth endpoint, ignoring transient network failures.
  - `useCurrentUserQuery`: Configured with automatic retries for transient network failures.
- **Role-based Route Guards & Separation**:
  - `RequireAuth`: Bắt buộc đăng nhập.
  - `RequireAdmin`: Bắt buộc quyền Quản trị viên (`Admin`).
  - `RequireNonAdmin`: Khóa các trang đặc thù của Khách hàng (`/cart`, `/checkout`, `/wishlist`, `/orders`) và Người bán (`/seller`, `/seller/*`) đối với tài khoản Admin, tự động chuyển hướng về `/admin` (hoặc `/admin/orders`).
  - `Header.tsx`: Ẩn giỏ hàng, danh sách yêu thích và kênh người bán khi là Admin; tùy biến menu avatar dành riêng cho quản trị viên.
- **Product Detail Page Standardization**:
  - `ProductReviewsSection.tsx`: Wrapped in standard card (`bg-white rounded-md border border-brand-border shadow-sm p-4 md:p-5 mb-6 text-left space-y-6`), uniform title `text-sm font-black text-brand-dark uppercase tracking-wider` ("ĐÁNH GIÁ SẢN PHẨM"), warm amber customer ratings badge (`Star` icon, smaller font `text-[11px]`).
  - `RelatedProduct.tsx`: Uniform title `text-sm font-black text-brand-dark uppercase tracking-wider` ("SẢN PHẨM TƯƠNG TỰ"), upgraded smart recommendation badge with `BrainCircuit` AI circuit icon and vibrant gradient (`text-[11px]`).
  - `ProductDescription.tsx`: Uniform titles `text-sm font-black text-brand-dark uppercase tracking-wider` for "THÔNG SỐ SẢN PHẨM" and "MÔ TẢ SẢN PHẨM".
- **Single-Point Mock / Real Data Toggles**:
  - `recommendationApi.ts`: `USE_MOCK_RECOMMENDATIONS = false` (toggles mock vs real `/recommendations/...` calls).
  - `analyticsConfig.ts`: `USE_MOCK_ANALYTICS = false` (toggles mock vs real `/analytics/...` calls).
- **Seller Center & Unified Analytics Architecture**:
  - `ShopAnalyticsDashboard.tsx`: Decomposed into clean, modular sub-components under `src/domains/seller/components/analytics/` (`AnalyticsFilterBar`, `AnalyticsKpiCards`, `AnalyticsRevenueChart`, `AnalyticsOrderChart`, `AnalyticsProductPerformance`, `AnalyticsPaymentChannels`).
    - `AnalyticsFilterBar`: Left side contains debounced (300ms) database product search with case-insensitive lowercase matching, returning thumbnails, names, IDs, prices, and "+ Thêm" action. Right side contains time preset dropdown (Hôm nay, 3 ngày qua, 7 ngày qua, Tự chỉnh) and product filter dropdown (Shop Top 10 + added items). When "Tự chỉnh" is chosen, displays Month (1-12) and Year selectors below with "Xem phân tích" button.
    - `AnalyticsKpiCards`: 3 dynamic KPI cards (Tổng Doanh Thu with average daily revenue formatted as subtitle, Số Đơn Đặt Hàng, Sản Phẩm Đã Bán) updated 100% dynamically based on the selected timeframe.
    - `AnalyticsRevenueChart`: Interactive SVG Spline Bezier curve with hover tooltip, custom waiting card, and empty states.
    - `AnalyticsOrderChart`: Daily order volume bar chart with fulfillment status distribution.
    - `AnalyticsProductPerformance`: Ranked product list with tabs (Doanh thu, Số đơn, Số lượng bán).
    - `AnalyticsPaymentChannels`: Overview of supported payment channels.
  - `RevenueView.tsx`: Streamlined view by removing static cumulative wallet cards ("Tổng Doanh Số Tích Lũy", "Số Đơn Giao Thành Công", "Số Dư Ví Rút Được", "Số Dư Đang Đóng Băng") so all metrics update exclusively according to the chosen time filter.
  - `ProductView.tsx` & `ProductRow.tsx`: Fixed product analyst action navigation by passing `onAnalytics` prop through `ProductTable` and `ProductRow` to route directly to `/seller/${shopId}/dashboard/revenue?productId=${productId}`.
  - `SellerFollowersView.tsx`: Streamlined shop followers management view. Removed the "Hoạt động gần nhất" column, removed quick filter buttons "Tất cả" and "7 ngày qua", defaulting to all followers with a calendar date picker defining the start date filter.
  - `SellerReviewsView.tsx`: Product-first review management flow. Seller selects product first -> displays complete review list with star breakdown, star rating filters, reply status filters, keyword search, order ID badge (`#ORD-...`), inline seller reply form, and pagination.
  - `SellerLayout.tsx`: Added "Trò chuyện với khách" directly into sidebar nav (`/seller/dashboard/chat`), added sublinks for "Đánh giá sản phẩm" (`/seller/dashboard/reviews`), "Người theo dõi" (`/seller/dashboard/followers`), and accurate breadcrumbs.
  - `AdminOverviewView.tsx`: Removed redundant "Doanh Thu Toàn Sàn" card in the top row (clean 3-card grid: Tổng Người Dùng, Tổng Đơn Hàng, Tổng Cửa Hàng). Removed internal shop select box; defaults to platform-wide statistics. Supports `?shopId=...` URL parameter with an active shop banner and "← Quay lại Toàn Sàn" action button.
  - `AdminShopsView.tsx`: Added an "Analyst" action button (icon `BarChart3`) in the shop action column, navigating directly to `/admin/overview?shopId=${s.id}`.






