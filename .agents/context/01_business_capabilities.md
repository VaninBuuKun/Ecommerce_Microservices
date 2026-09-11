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
- **Entities**: Order, SubOrder, SubOrderItem, Voucher, RefundRequest.
- **Commands**:
  - `CalOrderGrandTotalCommandHandler`: Calculates item prices, shop vouchers, platform vouchers, and GHN shipping fees.
  - `CreateOrderCommandHandler`: Creates parent Order and splits into SubOrders per Shop.
  - `SellerConfirmSubOrderCommandHandler`, `SellerRejectSubOrderCommandHandler`, `SellerPackageReadyCommandHandler`
  - `CompleteSubOrderCommandHandler`, `CancelSubOrderCommandHandler`
  - `CreateRefundCommandHandler`: Supports List<string> Medias for refund evidence images.
  - `ApproveRefundCommandHandler`, `RejectRefundCommandHandler`, `CancelRefundCommandHandler`
  - `CreateVoucherCommandHandler`, `UpdateVoucherCommandHandler` (Unique index on `Voucher.Code`)
- **Queries**:
  - `GetOrderByIdQueryHandler`, `GetSubOrdersQuery`, `GetSubOrdersByShopQueryHandler`, `GetSubOrderDetailQueryHandler`
  - `GetCompletedSubOrderCountForProductQueryHandler` (gRPC)
  - `GetVouchersQueryHandler`, `GetAvailableVouchersQueryHandler`
  - `GetMyRefundsQueryHandler`, `GetShopRefundsQueryHandler`

## 4. Sellers Service (PostgreSQL)
- **Entities**: SellerKyc, Shop, PickUpAddress (Streamlined to `ProvinceId`, `DistrictId`, `WardId` (long) and `AddressLine`), FollowedShop.
- **Commands**:
  - `RegisterKycCommandHandler`, `WithdrawKycDraftCommand`, `ApproveKycCommandHandler`
  - `CreateShopCommandHandler`, `UpdateShopCommandHandler`
  - `ActivateShopCommandHandler`, `SuspendShopCommandHandler`, `BanShopCommandHandler`
  - `ToggleFollowShopCommandHandler` (`POST /api/shops/{shopId}/follow`)
- **Queries**:
  - `GetMyKycQuery`, `GetMySellerProfileQuery`, `GetPublicShopByIdQuery`, `GetPublicShopsByOwnerIdQuery`
  - `GetAllShopsQueryHandler` (CQRS Query `GET /api/shop/all` for Admin with pagination, search & status filter)
  - `GetFollowedShopsQueryHandler` (`GET /api/shops/followed`), `CheckFollowShopStatusQueryHandler` (`GET /api/shops/{shopId}/follow-status`)
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
  - `SellerRevenueConsumer`: Automatically credits Shop Wallet on `SubOrder` delivery completion.
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
- **Users & Roles Management**: `UsersController` (`POST /api/users` Admin Create User, `POST /api/users/{id}/lock` & `unlock` synced with `IsActive`), `RolesController` (Full Role CRUD for Admin: `Admin`, `Manager`, `User`, `Staff`).

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

## 9. Notifications Service (PostgreSQL - Port REST 5080 / gRPC 5081)
- Email notifications, SMTP, system alerts, real-time SignalR Hub.

## 10. Frontend ACO Architecture (Apps - Components - Domains)
- **Directory Structure**:
  - `src/apps/`: Entry pages for customer (`/`, `/cart`, `/checkout`, `/products/:id`), seller (`/seller/select-shop`, `/seller/:shopId/dashboard`), auth (`/login`, `/register`), admin (`/admin`).
  - `src/domains/`: Domain logic grouped by boundary (`auth`, `catalog`, `cart`, `order`, `seller`, `kyc`, `address`, `wallet`, `shipping`). Contains `api/`, `hooks/`, `stores/`, `types/`, `components/`.
  - `src/shared/`: Cross-cutting utilities, helpers (`formatPrice`, `formatStock`, `authHelper`).
- **Recommendation System Integration**:
  - `recommendationApi.ts`: Client functions supporting pagination parameters (`getSimilarProducts`, `getPersonalizedRecommendations`, `getTrendingProducts`, `syncCatalogData`, `trackProductView`, `getProductViewStats`).
  - `useRecommendations.ts`: TanStack Query hooks (`useSimilarProductsQuery`, `usePersonalizedRecommendationsQuery`, `useInfinitePersonalizedRecommendationsQuery`, `useTrendingProductsQuery`, `useTrackProductViewMutation`, `useProductViewStatsQuery`, `useSyncRecommendationsMutation`).
  - `LandingPage.tsx`:
    - `BestSellersSection`: Powered by `useBestSellersQuery` with golden `Trophy` icon, "Top Bán Chạy" badge, and `motion.section` scroll-reveal animation.
    - `TodayRecommendationsSection`: Powered by `useInfinitePersonalizedRecommendationsQuery` (Fixed 18-item progressive chunks, max 6 pages = 108 products) with `useInView(margin: "-40px")` lazy viewport loading, persistent skeleton placeholders, and `Sparkles` icon.
    - `InterestedProductsSection`: Powered by `useTrendingProductsQuery` with `useInView(margin: "-40px")` lazy loading, `TrendingUp` icon, and "Trending 24h" badge.
  - `HomePage.tsx`:
    - `#trending-products`: Powered by `useTrendingProductsQuery`.
    - `#suggested-products`: Powered by `usePersonalizedRecommendationsQuery`.
  - `ProductDetailPage.tsx` & `RelatedProduct.tsx`:
    - `RelatedProducts`: Powered by `useSimilarProductsQuery` (Content-based similar products with fallback).
    - View & Dwell Time Tracking: `useTrackProductViewMutation` fires on mount and logs session dwell duration on unmount (min 2 seconds).



