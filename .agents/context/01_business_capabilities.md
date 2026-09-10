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

## 8. Frontend ACO Architecture (Apps - Components - Domains)
- **Directory Structure**:
  - `src/apps/`: Entry pages for customer (`/`, `/cart`, `/checkout`, `/product/:id`), seller (`/seller/select-shop`, `/seller/:shopId/dashboard`), auth (`/login`, `/register`), admin (`/admin`).
  - `src/domains/`: Domain logic grouped by boundary (`auth`, `catalog`, `cart`, `order`, `seller`, `kyc`, `address`, `wallet`, `shipping`). Contains `api/`, `hooks/`, `stores/`, `types/`, `components/`.
  - `src/shared/`: Cross-cutting utilities, helpers (`formatPrice`, `formatStock`, `authHelper`).
- **State & Query Integration**:
  - `useAuthStore` (Zustand) & `useSellerStore` (Zustand): Domain stores.
  - TanStack Query v5 custom hooks per domain (`useCatalog`, `useCart`, `useKyc`, `useSeller`).

