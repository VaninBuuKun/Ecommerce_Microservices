# 01. Business Capabilities & Implemented Features

This document provides a detailed breakdown of all implemented backend APIs, gRPC endpoints, and frontend features across the 7 microservices.

## 1. Catalog Service (MySQL)
- **Entities**: Product, ProductOption, ProductOptionValue, ProductVariant, Category, ProductReview.
- **Commands**:
  - `CreateProductCommandHandler`, `UpdateProductCommandHandler`, `DeleteProductCommandHandler`
  - `ToggleProductStatusCommand`, `InitVariantsCommandHandler`, `BulkUpdateVariantsCommandHandler`
  - `ReserveStocksCommandHandler` (gRPC), `ReleaseStocksCommandHandler` (gRPC)
  - `CreateCategoryCommandHandler`, `UpdateCategoryCommandHandler`, `DeleteCategoryCommandHandler`
  - `CreateProductReviewCommandHandler`
- **Queries**:
  - `GetProductsQueryHandler`, `GetProductByIdQuery`, `GetMyProductsQueryHandler`
  - `GetVariantsByIdsCommandHandler`, `GetVariantByIdQueryHandler`
  - `GetCategoriesQueryHandler`
  - `GetProductReviewsQuery`, `GetProductReviewsSummaryQuery`

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
  - `CreateVoucherCommandHandler`, `UpdateVoucherCommandHandler`
- **Queries**:
  - `GetOrderByIdQueryHandler`, `GetSubOrdersQuery`, `GetSubOrdersByShopQueryHandler`, `GetSubOrderDetailQuery`
  - `GetCompletedSubOrderCountForProductQueryHandler` (gRPC)
  - `GetVouchersQueryHandler`, `GetAvailableVouchersQueryHandler`
  - `GetMyRefundsQueryHandler`, `GetShopRefundsQueryHandler`

## 4. Sellers Service (PostgreSQL)
- **Entities**: SellerKyc, Shop, PickUpAddress.
- **Commands**:
  - `RegisterKycCommandHandler`, `WithdrawKycDraftCommand`, `ApproveKycCommandHandler`
  - `CreateShopCommandHandler`, `UpdateShopCommandHandler`
  - `ActivateShopCommandHandler`, `SuspendShopCommandHandler`, `BanShopCommandHandler`
- **Queries**:
  - `GetMyKycQuery`, `GetMySellerProfileQuery`, `GetPublicShopByIdQuery`, `GetPublicShopsByOwnerIdQuery`
  - `GetAllShopsQueryHandler` (CQRS Query `GET /api/shop/all` for Admin with pagination, search & status filter)
  - `ValidateShopOwnerQueryHandler` (gRPC), `GetShopsByIdsQueryHandler` (gRPC), `GetShopShippingInfoQueryHandler` (gRPC)

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
- **Entities**: Province, District, Ward, Shipment.
- **Features**:
  - `LocationSyncJob`: Cron job syncing GHN location hierarchy.
  - `CalculateBatchShippingFeeQueryHandler` (gRPC & REST): GHN API fee calculation.
  - `CreateShipmentConsumer`: MassTransit Consumer creating GHN waybills.
  - `WebhooksController`: Receives GHN status updates (`Delivered`, `Shipped`, `Picking`, `Returned`, `Cancelled`).
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

