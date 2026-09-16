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
  - `AdminAnalyticsService.GetOverviewAsync`: Consolidated separate database round-trips (`TotalOrders`, `PlatformRevenue`, `TotalGmv`, `NetPlatformRevenue`, `PlatformDiscountAmount`, `TotalShippingFee`, and today's stat) into a single SQL aggregation query using `GroupBy(_ => 1)` with conditional sums (`CASE WHEN "Date" = @today THEN ...`).
  - `SellerAnalyticsService.GetOverviewAsync`: Consolidated queries on `DailyShopRevenues` (today's stat, month-to-date revenue, total orders, completed/refunded/cancelled counts, refund amount) into a single SQL aggregation query using `GroupBy(_ => 1)`.
- **Entities**:
  - `DailyShopRevenue` (Id, ShopId, Date, Revenue [Net Payout], OrderCount, CompletedOrderCount, CancelledOrderCount, RefundedOrderCount, RefundAmount, UpdatedDate)
  - `DailyPlatformRevenue` (Id, Date, TotalGmv, PlatformRevenue [Gross Commission], PlatformDiscountAmount, NetPlatformRevenue [Net Commission Profit], TotalOrders, TotalShippingFee, UpdatedDate)
  - `DailyCategoryRevenue` (Id, Date, ParentCategoryId, Revenue, SoldQuantity, UpdatedDate) - Tinh gọn chỉ theo Ngành hàng cha (Parent Category), không lưu sub-category hay tên chuỗi trùng lặp.
  - `ShopProductStats` (Id, ShopId, ProductId, ProductName, ThumbnailUrl, ParentCategoryId, SoldQuantity, Revenue, UpdatedDate) - Chỉ lưu `ParentCategoryId` phục vụ lọc/nhóm vĩ mô. Tên danh mục do Frontend tự động tra cứu từ cache cây danh mục (`catalog:categories:tree`).
- **Financial Accounting & Logistics Settlement**:
  - Shipping fee (`ShippingFee`) is collected by platform to settle with 3rd-party courier (GHN) and isolated in `DailyPlatformRevenue.TotalShippingFee`, separate from GMV and Net Platform Revenue.
  - Shop net revenue is strictly calculated as `(SubTotal - SellerDiscount) - CommissionFee`.
  - Commission fee is computed on the actual shop merchandise value `SubTotal - SellerDiscount` (not grand total with shipping).
  - In `ShopProductStats`, sub-order net revenue is allocated proportionally among line items based on `UnitPrice * Quantity`.
- **Event Consumers**:
  - `SubOrderCompletedAnalyticsConsumer`: Materializes financial metrics (GMV, Gross Commission, Voucher Burn, Net Shop Revenue, Shipping Fee) from `SubOrderCompletedEvent`. Snapshots `ProductName`, `ThumbnailUrl`, `ParentCategoryId` into `ShopProductStats` and upserts into `DailyCategoryRevenue`.
  - `SubOrderCancelledAnalyticsConsumer` [NEW]: Listens to `SubOrderRejectedEvent` and increments `CancelledOrderCount` in `DailyShopRevenue`.
  - `RefundApprovedAnalyticsConsumer` [NEW]: Listens to `RefundApprovedEvent` and increments `RefundedOrderCount` and `RefundAmount` in `DailyShopRevenue`.
- **Controllers & APIs**:
  - `SellerAnalyticsController` (`/api/analytics/shops/{shopId}`):
    - `GET /overview`: Today's revenue, month's revenue, order counts (completed, cancelled, refunded), refund amount, product counts.
    - `GET /revenue-chart?period=7d|30d&year=&month=`: Daily revenue timeline points with period, year, and month filtering.
    - `GET /top-products?limit=30`: Top 30 products sorted by sold quantity and revenue (backend clamped `Math.Clamp(limit, 1, 30)`).
  - `AdminAnalyticsController` (`/api/analytics/admin`):
    - `GET /overview`: Total shops, total orders, platform revenue, GMV, net platform revenue, total shipping fee (GHN), today's new orders.
    - `GET /revenue-chart?period=7d|30d&year=&month=`: Continuous daily platform revenue timeline points with GMV, Net metrics, and year/month drilldown support.
    - `GET /top-products?page=1&pageSize=15`: Platform-wide top products with pagination (supports default Top 30 in 2 pages x 15 items, backend clamped `Math.Clamp(pageSize, 1, 30)`).
    - `GET /categories?period=7d|30d|custom&year=&month=`: Parent category performance breakdown with revenue, orders, sold units, and platform percentage, supporting custom year/month filtering.
    - `GET /products/{productId}`: Deep-dive product analytics with product details, stock, KPIs, and daily sales trendline.
    - `GET /shops/{shopId}/products?page=1&pageSize=15`: Paginated product performance for a specific shop (backend clamped `Math.Clamp(pageSize, 1, 50)`).

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
- **Admin Overview & 4-Mode Analytics (Platform / Category / Shop / Product)**:
  - `AdminAnalyticsFilterBar`:
    - 4 Chế độ phân tích độc lập:
      1. `Phân tích sàn`: Chỉ có bộ lọc mốc thời gian + nút "Áp dụng" (màu thương hiệu vàng/đen). Không còn chứa radio chọn danh mục.
      2. `Phân tích ngành hàng`: Chứa bộ lọc Radio Check danh mục cha (viền đen 2px, khi chọn tô màu xanh ngọc emerald, triệt tiêu giật layout) + bộ lọc thời gian + nút "Áp dụng" màu ngọc bích emerald.
      3. `Phân tích một shop`: Nhập mã Shop ID + bộ lọc thời gian + nút "Phân tích shop" màu tím.
      4. `Phân tích một sản phẩm`: Nhập mã Product ID / dán URL sản phẩm + bộ lọc thời gian + nút "Phân tích sản phẩm" màu hổ phách.
    - **Nút Hành Động Động Căn Phải Cùng**: Tự động vô hiệu hóa & chuyển sang màu xám ("Đã áp dụng" / "Đã phân tích") sau khi bấm; tự động sáng màu và mở khóa khi người dùng thay đổi filter hoặc chuyển tab.
  - `AdminCategoryPerformanceTable` [NEW]:
    - Component hiển thị bảng thống kê hiệu suất ngành hàng toàn sàn.
    - Sử dụng React Query cache từ Catalog service (`useCategoriesQuery()`), tra cứu tên danh mục và icon/ảnh thu nhỏ trực tiếp từ cache mà backend chỉ cần trả về `categoryId`.
    - Cột dữ liệu: Thứ hạng (#), Ngành hàng (ảnh, tên, mã định danh `#ID`), Số lượng đã bán (cái), Doanh thu (VND), Tỷ trọng đóng góp kèm thanh tiến trình trực quan, và nút hành động "Phân tích" (drill-down 1-click sang chế độ phân tích ngành hàng).
  - `AdminOverviewView`: 4 thẻ KPI đồng bộ (`Tổng GMV`, `Doanh Thu Sàn`, `Phí Vận Chuyển Đơn Vị GHN`, `Tổng Đơn Hàng`).
    - Chế độ Toàn Sàn: Biểu đồ đường cong Spline doanh thu sàn + Biểu đồ trạng thái đơn hàng + Bảng thống kê hiệu suất ngành hàng `AdminCategoryPerformanceTable` + Bảng Top 30 sản phẩm bán chạy nhất toàn sàn phân trang chuẩn xác (2 trang x 15 sản phẩm).
    - Chế độ Ngành Hàng: Thẻ tóm tắt thông tin ngành hàng đang chọn (ảnh đại diện, tên, ID, đã bán trong kỳ, doanh thu ngành, tỷ trọng toàn sàn) + Bảng Top 30 sản phẩm bán chạy nhất thuộc ngành hàng đó phân trang (2 trang x 15 sản phẩm).
    - Chế độ Shop: Thẻ KPI shop, biểu đồ doanh thu shop, biểu đồ trạng thái đơn hàng, và bảng toàn bộ sản phẩm của shop kèm phân trang.
    - Chế độ Sản phẩm: Giao diện `AdminProductDeepDiveView` hiển thị thẻ sản phẩm (ảnh đại diện, tên, mã ID, giá, tồn kho, nhãn danh mục), 3 thẻ KPI chuyên biệt (Doanh số, Doanh thu, Lượt bán hôm nay) và biểu đồ xu hướng doanh thu hàng ngày.
  - Điều hướng Deep-Linking:
    - `AdminShopsView`: Nút "Phân tích" điều hướng trực tiếp sang `/admin/overview?mode=shop&shopId=${s.id}`.
    - `AdminProductsView`: Nút "Phân tích" điều hướng trực tiếp sang `/admin/overview?mode=product&productId=${p.id}`.
- **Seller Center Analytics Dashboard**:
  - `ShopAnalyticsDashboard.tsx` & `AnalyticsFilterBar`:
    - **2 Chế độ phân tích cho Người Bán**:
      1. `Phân tích cửa hàng` (Mặc định): Không cần nhập ID, chỉ chọn mốc thời gian rồi nhấn nút "Áp dụng" để xem toàn bộ số liệu cửa hàng (KPI, Spline Chart, Biểu đồ đơn hàng, Bảng Top 30 sản phẩm).
      2. `Phân tích một sản phẩm`: Nhập Product ID từ CSDL và chọn mốc thời gian. **Cơ chế tải trễ (Deferred Data Loading)**: Mới vào không hiển thị dữ liệu ngẫu nhiên, chỉ sau khi người bán nhập ID và nhấn "Áp dụng" thì mới hiển thị báo cáo chuyên sâu `AdminProductDeepDiveView`.
    - **Nút "Áp Dụng" Tự Động Làm Xám & Kích Hoạt Lại**: Tự động disabled + xám khi đã bấm; tự sáng màu khi đổi thời gian hoặc đổi mã ID.
  - `AnalyticsRevenueChart.tsx`: Biểu đồ Spline đường cong Bezier doanh thu. Áp dụng thuật toán chia mốc thông minh `shouldShowXAxisLabel` (hiển thị khoảng 6-7 nhãn ngày cách đều nhau kèm vạch chia tick mark, luôn có ngày đầu và ngày cuối tháng), triệt tiêu hoàn toàn lỗi trùng đè chữ trên trục X khi xem tháng 28-31 ngày. Hover node tương tác hiển thị tooltip đầy đủ số tiền và số đơn hàng cho từng ngày.
  - `AnalyticsOrderChart`: Hiển thị số lượng đơn hàng theo trạng thái thực tế từ backend (Thành công, Hoàn trả kèm số tiền hoàn trả thật, Đã hủy), nhãn ngày cách đều đồng bộ với biểu đồ doanh thu.
  - `RevenueView.tsx`: Tinh gọn các thẻ tĩnh tích lũy, 100% số liệu cập nhật phụ thuộc vào mốc thời gian được lọc.
  - `SellerFollowersView.tsx`: Tinh gọn giao diện người theo dõi, hỗ trợ lọc theo ngày bắt đầu trên lịch.
  - `SellerReviewsView.tsx`: Quy trình quản lý đánh giá ưu tiên chọn sản phẩm trước, hỗ trợ phân loại theo sao, trạng thái phản hồi và trả lời trực tiếp inline.
- **User Profile Page (`UserProfilePage.tsx`)**:
   - **Phân Quyền Tab Dành Cho Quản Trị Viên (`checkIsAdmin()`)**:
     - Khi tài khoản đăng nhập là Quản trị viên (`isAdmin === true`), trang hồ sơ người dùng **chỉ hiển thị duy nhất 2 tab**: `Thông tin tài khoản` (`profile`) và `Thông báo` (`notifications`).
     - Toàn bộ 4 tab đặc thù của người mua/người bán (`Địa chỉ nhận hàng`, `Đơn hàng của tôi`, `Quản lý ví`, `Yêu cầu hoàn tiền`) được ẩn hoàn toàn trên cả Sidebar lẫn Content view.
     - Tự động fallback/chuyển hướng về tab `profile` nếu URL hoặc route có tham số tab không thuộc phạm vi cho phép của admin.
   - **Quy Tắc Đơn Giản Hóa Trạng Thái Nút Bấm Analytics**:
     - Khi thay đổi filter (ngành hàng, mốc thời gian, tháng/năm, mã shop/sản phẩm) hoặc chuyển tab (chế độ): Lập tức gọi `setIsApplied(false)`, nút sáng màu và bấm được bình thường.
     - Khi được điều hướng sang một Shop ID mới ("qua cái mới rồi") từ bảng quản lý cửa hàng: Tự động reset `isApplied = false`, chấm dứt tình trạng kẹt chữ "Đã phân tích".
- **Return Logistics, Refund Requests Redesign & Voucher Improvements**:
  - `Shippings.Api`:
    - Bổ sung `GetShipmentsBySubOrderIdAsync(long subOrderId)` trả về toàn bộ danh sách vận đơn (bao gồm cả đơn giao hàng gốc và đơn vận chuyển hoàn trả `isRefund = true`).
    - `GET /api/shipments/sub-order/{subOrderId}` trả về `List<Shipment>` sắp xếp theo thời gian mới nhất.
    - Cập nhật `AdminShipmentsView.tsx`: Thêm cột "Loại vận đơn" phân biệt rõ ràng vận đơn giao hàng (`🚚 Giao hàng`) và hoàn trả (`🔄 Hoàn trả`) kèm bộ lọc loại vận đơn.
  - `CustomerRefundModal` [NEW]:
    - Tách thành Modal hoàn tiền / trả hàng độc lập tại `src/domains/order/components/refund/CustomerRefundModal.tsx`, sử dụng `createPortal(..., document.body)` với `z-10000`.
    - Hỗ trợ tải lên tối đa 6 hình ảnh và 3 video bằng chứng minh họa qua S3/MinIO `storageService.uploadFile` kèm thanh tiến trình phần trăm và trình phát video xem trước.
    - Áp dụng nguyên tắc hoàn tiền toàn bộ đơn hàng con (`subOrder.GrandTotal`).
  - `CustomerOrderDetailView.tsx`:
    - Hiển thị thẻ vận đơn hoàn trả hàng (`Kiện hàng hoàn trả về kho của bạn`) với viền hổ phách, hiển thị địa chỉ người gửi, nơi nhận và nhật ký tracking.
    - Chế độ Seller xem chi tiết: Ẩn hoàn toàn Shop Info Banner, nút Chat với shop, các thao tác của người mua (Đánh giá, Mua lại, Hủy đơn); đổi các nhãn shop thành "Kho của bạn" / "Voucher Shop".
    - Bọc toàn bộ các modal (`showCancelModal`, `showCompleteModal`, `showNoWalletModal`) bằng `createPortal(..., document.body)` với `z-10000`.
    - Chuẩn hóa `subOrderId` dạng chuỗi (`String(detail.id)`) và cập nhật `useCancelCustomerSubOrderMutation`, `useCompleteSubOrderMutation`, `useCreateRefundMutation` để làm mới query cache `["subOrderDetail"]`.
  - `RefundRequestsView.tsx` [REDESIGNED]:
    - Tái thiết kế toàn diện từ dạng lưới thẻ sang bảng chuẩn (`table`) đồng bộ với `OrdersView.tsx`.
    - Cột dữ liệu: Mã yêu cầu & đơn con, Khách hàng, Tiền hoàn trả (đỏ đậm), Lý do (truncate 1 dòng kèm tooltip), Bằng chứng (số lượng tệp, bấm mở modal), Trạng thái (`getRefundStatusBadge`), Thao tác.
    - 3 Hành động rõ ràng:
      1. `Chi tiết đơn`: Mở trực tiếp `CustomerOrderDetailView` với `isSeller={true}`.
      2. `Chi tiết hoàn`: Mở Modal chi tiết đầy đủ lý do, mô tả, đếm ngược hạn tự động xử lý, phòng trưng bày bằng chứng (hình ảnh phóng to lightbox, video có trình phát tương tác) và ghi chú phản hồi từ Shop.
      3. `Duyệt` & `Từ chối` (chỉ hiển thị khi `Pending`): Mở Modal nhập ghi chú gửi cho khách hàng.
    - Bộ lọc trạng thái: Mặc định là `Pending` ("Chưa xử lý"). Hỗ trợ lọc `All`, `Approved`, `Rejected`, `Cancelled`.
    - Ô tìm kiếm nhanh và phân trang tiêu chuẩn bằng component `Pagination`.
  - **Khắc phục lỗi Validation Voucher (Đơn tối thiểu vs Giá trị giảm)**:
    - Backend: `CreateVoucherCommandValidator.cs` bổ sung quy tắc kiểm tra `MinOrderValue >= DiscountValue` (giảm cố định) và `MinOrderValue >= MaxDiscountAmount` (giảm theo %).
    - Frontend: `voucher.schema.ts` bổ sung các quy tắc Zod `.refine()` tương ứng.
  - **Tối ưu Bảng Voucher Seller & Admin**:
    - Loại bỏ cột "Loại Giảm" dư thừa tại `CouponsView.tsx` và `AdminVouchersView.tsx` do đã có ký hiệu rõ ràng (`đ` cố định, `%` phần trăm).
  - **Dọn dẹp Mock Data**:
    - `SellerFollowersView.tsx`: `MOCK_FOLLOWERS = []`.
    - `SellerReviewsView.tsx`: `MOCK_SELLER_PRODUCTS = []`, `MOCK_REVIEWS_MAP = {}`.
    - Đảm bảo hệ thống gọi API thực tế và hiển thị trạng thái rỗng chuẩn mực.
