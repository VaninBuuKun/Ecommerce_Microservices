# Session Scratchpad

## Completed Work
1. **100% UI Fidelity Alignment**: Restored exact 1:1 original JSX and Tailwind styling for all pages in `src/apps/` (`HomePage`, `ProductDetailPage`, `CartPage`, `CheckoutPage`, `UserProfilePage`, `LoginPage`, `RegisterPage`, `SellerDashboardPage`, `ShopSettingsPage`, `AdminDashboardPage`).
2. **Refund Request Medias**:
   - Extended `RefundRequest` domain entity, DB configuration in `OrderDbContext`, `CreateRefundCommand`, `RefundRequestDto`, and `RefundsController` to handle `List<string> Medias`.
   - Updated FE `orderService` and `useCreateRefundMutation`.
   - Added S3 upload UI with multi-file preview and removal in `CustomerOrderDetailView.tsx` refund modal.
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
