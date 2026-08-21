# Session Scratchpad

## Completed Work
1. **100% UI Fidelity Alignment**: Restored exact 1:1 original JSX and Tailwind styling for all pages in `src/apps/` (`HomePage`, `ProductDetailPage`, `CartPage`, `CheckoutPage`, `UserProfilePage`, `LoginPage`, `RegisterPage`, `SellerDashboardPage`, `ShopSettingsPage`, `AdminDashboardPage`).
2. **Refund Request Medias**:
   - Extended `RefundRequest` domain entity, DB configuration in `OrderDbContext`, `CreateRefundCommand`, `RefundRequestDto`, and `RefundsController` to handle `List<string> Medias`.
   - Updated FE `orderService` and `useCreateRefundMutation`.
   - Integrated S3 direct multi-file upload (`storageService.getUploadUrl` + `uploadS3`) with image/video preview and removal in `CustomerOrderDetailView.tsx` refund modal.
3. **Admin User Management Component Refactoring**:
   - Refactored `AdminUsersView` into `src/domains/admin/components/AdminUsersView.tsx`.
   - Added user table with avatar, pagination, search bar, role assignment modal (`AssignRole`), and account lock/unlock toggles.
4. **Register Page Form Fix**:
   - Updated `RegisterPage.tsx` and `authApi.ts` to split and send `firstName` and `lastName` fields matching backend requirements.
5. **Admin Shipments Management & GHN Webhook Simulation**:
   - Added `GET /api/shipments` endpoint to `ShipmentsController.cs` in `Shippings.Api`.
   - Created `AdminShipmentsView.tsx` with paginated shipment table, status badges, and GHN Webhook trigger modal (`/api/shipping-webhooks/ghn`).
   - Integrated "Quản lý vận chuyển" sidebar link in `AdminLayout.tsx` and route in `AdminDashboardPage.tsx`.
6. **User Profile, Gender Validation, Role Management & Unified Modal**:
   - Removed `Nickname` from `AppUser` entity and `AccountInfoTab.tsx`.
   - Added `Gender` normalization/validation in `UsersController.cs` (handling `Male`, `Female`, `Other`).
   - Added `POST /api/users` Admin Create User endpoint and `RolesController.cs` for Admin Role CRUD.
   - Updated `AccountInfoTab.tsx` to handle unselected birth dates/genders and send English gender strings.
   - Updated `AdminUsersView.tsx` with roles (`Admin`, `Manager`, `User`, `Staff`), "Tạo tài khoản" button, Roles Management tab, and unified `ConfirmModal` (`createPortal` + `z-[10000]`).
7. **Admin Shop Management API & FE Pagination/Ban Upgrades**:
   - Added `GetAllShopsQuery` & `GetAllShopsQueryHandler` (CQRS) and `GET /api/shop/all` in `Sellers.Api`.
   - Upgraded `AdminShopsView.tsx` with Customer ID column, text truncation (`...`), direct public shop link opening in new tab, status filter, Ban button calling `PUT /api/shop/{id}/ban`, and numbered pagination controls.
8. **Custom Password Validator & Auth Gateway Error Handling Sync**:
   - Added `IsActive` property to `AppUser.cs`.
   - Updated `CustomResourceOwnerPasswordValidator.cs` in `Identity.Api` to validate `IsActive` (`account_disabled`), `IsLockedOutAsync` (`account_locked`), and invalid credentials.
   - Synchronized `/lock` and `/unlock` endpoints in `UsersController.cs` to update `IsActive`.
   - Updated `AuthController.cs` in `ApiGateway` to return distinct Vietnamese error messages for disabled, locked, and invalid credential cases.
   - Updated `AdminUsersView.tsx` to handle `isActive` and trigger unified `/lock` & `/unlock` endpoints correctly.
9. **Wishlist & Follow Shop (with Real-time Notifications)**:
   - Added `.gitignore` rules for AI workspace folders (`.agents/`, `.antigravity/`, `.gemini/`, `.brain/`, `.scratch/`, `scratchpad.md`).
   - `Catalog.Api`: Added `Wishlist` entity & EF configuration, `AddWishlistTable` migration, `ToggleWishlistCommand`/Handler, `GetMyWishlistQuery`/Handler, and `WishlistsController` (`POST /api/wishlists/toggle/{productId}`, `GET /api/wishlists`).
   - `Sellers.Api`: Added `FollowedShop` entity & EF configuration, `AddFollowedShopsTable` migration, `ToggleFollowShopCommand`/Handler, `GetFollowedShopsQuery`/Handler, `CheckFollowShopStatusQuery`/Handler, and `ShopFollowersController` (`POST /api/shops/{shopId}/follow`, `GET /api/shops/followed`, `GET /api/shops/{shopId}/follow-status`).
   - `Notifications.Api`: Added `ProductCreatedEvent` contract and `ProductCreatedNotificationConsumer` to broadcast SignalR notification to group `shop-channel-{shopId}`.
   - Frontend (`React 19 ACO`): Created `wishlistApi.ts`, `useWishlist.ts`, `WishlistButton.tsx` (Framer Motion pulse animation), `WishlistPage.tsx`, `followShopApi.ts`, `useFollowShop.ts`, and `FollowShopButton.tsx`.
10. **ProductImage Cleanup**:
   - Removed obsolete `ProductImage.cs` entity and `ProductImages` DbSet/mappings from `Catalog.Api`.
   - Generated & applied EF Migration `RemoveProductImageTable`.
   - Removed all `p.Images` includes from `ProductsWithCursorPaginationSpec` and `WishlistByCustomerIdSpec`.
   - Standardized on `imageUrls: string[]` JSON column.
11. **Persistent Notification Record for Product Creation**:
   - Updated `ProductCreatedNotificationConsumer.cs` in `Notifications.Api` to insert a persistent `Notification` record into `NotificationDbContext` (`Notifications` table) with `Type = "ShopProductCreated"`, `ReferenceId = ProductId.ToString()`, `UserId = ShopId`, and `CreatedAt` before broadcasting realtime via SignalR.
12. **NotificationType Enum Refactoring**:
   - Created `NotificationType` enum (`OrderCreated`, `PaymentSucceeded`, `PaymentFailed`, `SubOrderShipped`, `ShopProductCreated`, `NewDeviceLogin`, `SystemAlert`) in `Ecommerce.Services.Notifications.Api.Models`.
   - Updated `Notification` entity `Type` property to `NotificationType` enum.
   - Configured `HasConversion<string>()` in `NotificationDbContext.cs` mapping per `AGENTS.md` guidelines.
   - Refactored all MassTransit consumers (`ProductCreatedNotificationConsumer`, `SubOrderCreatedNotificationConsumer`, `SubOrderShippedNotificationConsumer`, `PaymentSucceededNotificationConsumer`, `PaymentFailedNotificationConsumer`) to use strongly-typed `NotificationType` enum values.
13. **Frontend Wishlist & Notification Integration**:
   - Added `src/domains/notification/` module (ACO Architecture) with `notificationApi.ts`, `useNotifications.ts`, and `notification.types.ts`.
   - Updated `NotificationsController.cs` and `NotificationService.cs` in `Notifications.Api` to filter notifications by `userId` and optional followed `shopIds`.
   - Added Heart icon button to `Header.tsx` next to Cart button with live badge counter and hover dropdown preview.
   - Connected `Header.tsx` Notification dropdown to `useNotifications()` hook for real-time notification list & mark as read.
   - Replaced static heart button in `ProductDetailPage.tsx` with live `<WishlistButton productId={product.id} />`.
   - Redesigned `WishlistPage.tsx` grid layout & card design using `LandingPage.tsx` ProductCard aesthetics (Framer Motion hover animations, price formatting, ratings, shop name, and inline toggle button).
   - Registered `/wishlist` route in `AppRoutes.tsx`.
14. **Simplified Notification Query & Event Publishing Removal**:
   - Removed `IPublishEndpoint` event publishing from `CreateProductCommandHandler.cs` in `Catalog.Api`.
   - Removed `ProductCreatedNotificationConsumer.cs` from `Notifications.Api`.
   - Simplified `NotificationsController.cs` and `NotificationService.cs` in `Notifications.Api` to query notifications strictly by `UserId`.
   - Simplified Frontend `notificationApi.ts` and `useNotifications.ts` to call `GET /api/notifications` without shop ID params.
15. **Frontend API Client & TypeScript Import Conventions**:
   - Updated `AGENTS.md` rules to strictly mandate `import { api } from "@/core";` for API requests and `import type { ... }` for TypeScript interface/type imports across all frontend modules.
   - Refactored `notificationApi.ts`, `wishlistApi.ts`, and `followShopApi.ts` to use `import { api } from "@/core";`.
16. **AppRoutes Migration to `src/apps/` Architecture**:
   - Refactored `AppRoutes.tsx` to import 100% of pages exclusively from `src/apps/` (`customer/`, `seller/`, `admin/`, `auth/`) per ACO Architecture rules.
   - Updated `SellerDashboardPage.tsx` in `src/apps/seller/pages` with full sub-route bindings using `@/domains/` modules without altering any visual styles or layout logic.
17. **CategoryList Layout Restoration**:
   - Restored 2-row grid pairing carousel layout in `src/domains/catalog/components/categories/CategoryList.tsx` with Framer Motion hover animations, circular icons, and smooth scroll buttons matching original `LandingPage.tsx` aesthetics.
