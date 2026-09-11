- [x] Khắc Phục Triệt Để Hiện Tượng Bị Đăng Xuất Khi Restart Server (Silent Refresh Trên FE, Chống Xóa Session Do Lỗi Mạng & Chuẩn Hóa Cặp Khóa Ký/DataProtection Trên Identity Service):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Frontend Auth Resilience (`AuthProvider.tsx`)**:
       - Cơ chế **Silent Refresh** khi khởi động: Khi mở trang hoặc F5, nếu `accessToken` null hoặc hết hạn (`!isAuthenticated(token)`), `AuthProvider` chủ động gọi `authService.refresh()` để đổi lấy `accessToken` mới từ HttpOnly Cookie 7 ngày (`refresh_token`) trước khi các guard chuyển hướng đến `/login`.
       - Bảo vệ session khi restart server / lỗi mạng: Thay thế cơ chế xóa sạch session bừa bãi khi `currentUserQuery.isError` bằng kiểm tra nghiêm ngặt `(error as any)?.response?.status === 401`. Nếu là Network Error (`ERR_CONNECTION_REFUSED` do server đang restart) hoặc 5xx, tuyệt đối **không** gọi `clearState()`, giữ nguyên session người dùng.
    2. **Frontend Axios Interceptor (`axiosInstance.ts`) & Query Retry (`useAuth.ts`)**:
       - `axiosInstance.ts`: Refresh promise error handler chỉ xóa session (`clearState()`) khi server từ chối xác thực bằng HTTP 401 hoặc 400. Network error trong lúc refresh sẽ không làm mất session.
       - `useCurrentUserQuery`: Bổ sung cấu hình retry 2 lần đối với lỗi mạng / server rebooting để tự động phục hồi ngay khi backend sẵn sàng.
    3. **Backend Cryptographic & Key Persistence (`Identity.Api`)**:
       - `InfrastructureConfiguration.cs`: Cấu hình ASP.NET Core Data Protection cố định (`PersistKeysToFileSystem` tại `AppContext.BaseDirectory/dataprotection-keys` với `SetApplicationName("EcommerceMicroservices")`), đảm bảo payload refresh token trong bảng `PersistedGrants` của PostgreSQL luôn giải mã được qua các lần restart.
       - Chỉ định đường dẫn cố định cho `AddDeveloperSigningCredential` tới `AppContext.BaseDirectory/tempkey.jwk` và bổ sung MSBuild item group copy `tempkey.jwk` (`PreserveNewest`) trong `Identity.Api.csproj`, tránh việc sinh khóa RSA mới làm vô hiệu hóa token cũ.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Frontend: `npm run build` -> Vite production build succeeded in 913ms (0 errors).

- [x] Triển Khai Cơ Chế Financial Snapshot Phí Hoa Hồng Sàn Vào SubOrder & Saga, Đưa PlatformCommissionConfig Về Order Service (Triệt Tiêu gRPC Hop), Refactor SellerRevenueConsumer & Chuẩn Hóa Kế Toán Analytics:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Kiến trúc Financial Snapshot & Quản Lý Phí Hoa Hồng Nội Bộ Tại Orders Service**:
       - `PlatformCommissionConfig.cs`: Đưa thực thể cấu hình hoa hồng sàn về `Orders.Domain` và `OrderDbContext` (`OrdersDb`), loại bỏ hoàn toàn việc gọi gRPC sang Payments khi tạo đơn hàng.
       - `AdminCommissionController.cs` (`Orders.Api`): Cung cấp API `GET /api/admin/commission` và `PUT /api/admin/commission` với CQRS MediatR (`GetPlatformCommissionQuery`, `UpdatePlatformCommissionCommand`).
       - `CreateOrderCommandHandler.cs`: Đọc trực tiếp cấu hình hoa hồng từ repository nội bộ trong cùng Unit of Work (latency 0ms), tính toán và snapshot vào `SubOrder`.
       - `SubOrder.cs`: Thêm 2 trường snapshot `CommissionRate` (decimal) và `CommissionFee` (long - VND) cùng computed property `NetRevenue => GrandTotal - CommissionFee`. Thêm method `SetCommission(rate, fee)`.
       - `Order.cs`: Thêm method `SetCommission(shopId, rate, fee)`.
       - `SubOrderSagaState.cs` & `SubOrderStateMachine.cs`: Thêm và gán `CommissionRate`, `CommissionFee` vào Saga state khi nhận `SubOrderCreatedEvent`.
       - `CompleteSubOrderCommandHandler.cs` & `OrderJobService.cs`: Truyền trọn vẹn `CommissionRate`, `CommissionFee`, `NetRevenue` từ `SubOrder` vào `SubOrderCompletedEvent`.
       - `GetSubOrderDetailQuery.cs` & Handler: Bổ sung `CommissionRate`, `CommissionFee`, `NetRevenue` vào DTO chi tiết đơn cho Seller xem.
       - Dọn dẹp: Bỏ RPC `GetPlatformCommissionRate` khỏi `payment.proto`, `PaymentGrpcServer.cs`, và `PaymentClientService.cs`.
    2. **Refactor Quyết Toán Ví Người Bán & Xóa Bỏ Dữ Liệu Thừa (`Payments.Api`)**:
       - `SellerRevenueConsumer.cs`: Đọc trực tiếp snapshot `CommissionFee`, `CommissionRate`, `NetRevenue` từ `SubOrderCompletedEvent` để cộng `netRevenue` vào ví Shop Owner và ghi nhận `WalletTransaction`.
       - Xóa bỏ hoàn toàn thao tác ghi và bảng `RevenueRecords` (thừa thãi, không có API nào đọc).
       - Xóa bỏ `AdminCommissionController`, `CommissionService`, `ICommissionService`, `PlatformCommissionConfig` khỏi `Payments.Api`.
    3. **Chuẩn Hóa Kế Toán Sàn TMĐT (`Analytics.Api`)**:
       - `DailyPlatformRevenue.cs`: Bổ sung `TotalGmv` (tổng giá trị giao dịch), `PlatformDiscountAmount` (voucher trợ giá), `NetPlatformRevenue` (doanh thu thuần sàn = `PlatformRevenue - PlatformDiscountAmount`).
       - `SubOrderCompletedAnalyticsConsumer.cs`: Sửa lỗi tính doanh thu sàn bằng `msg.TotalAmount`. Tách biệt rành mạch GMV toàn sàn, Doanh thu hoa hồng sàn thu được (`msg.CommissionFee`), Voucher sàn trợ giá (`msg.PlatformDiscount`), và Doanh thu thực nhận của Shop (`msg.NetRevenue`).
       - `AdminAnalyticsDtos.cs` & `AdminAnalyticsService.cs`: Cung cấp đầy đủ chỉ số GMV, Gross Commission, Voucher Burn, và Net Commission Revenue cho Overview và Revenue Chart.
    4. **EF Core Migrations**:
       - `OrderDbContext`: Tạo & apply migration `Add_Commission_Snapshot_To_SubOrder` và `Add_PlatformCommissionConfig_To_Orders`.
       - `AnalyticsDbContext`: Tạo & apply migration `Add_Platform_Financial_Metrics`.
       - `PaymentDbContext`: Tạo & apply migration `Remove_Redundant_Commission_And_RevenueRecord` (drop bảng `RevenueRecords` và `PlatformCommissionConfigs`).
  - **Kiểm Thử & Biên Dịch**:
    - Solution build: `dotnet build` -> Build succeeded (0 errors).
    - Database migrations: `dotnet ef database update` cho cả 2 DbContext thành công.

- [x] Hoàn Thiện Seller Followers View, Tái Sử Dụng OrdersView Theo CustomerId, Header Bảng Chuẩn ProductTable, Bộ Lọc Thời Gian Cuốn Lịch, Triển Khai Backend Follow Shop API & Thiết Kế Lại Nút Follow Shop:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **SellerFollowersView (`SellerFollowersView.tsx`)**:
       - Hiển thị ID khách hàng (`ID: #{follower.userId}`) thay vì email/username.
       - Xóa bỏ popup Modal xem chi tiết đơn. Chuyển sang tái sử dụng trực tiếp component `OrdersView` với `customerId={selectedFollower.userId}` và nút "Quay lại người theo dõi" (`onBack={() => setSelectedFollower(null)}`).
       - Đồng bộ style tên cột bảng (`thead tr`) thành `border-b border-brand-border bg-brand-light-soft/50 text-brand-muted font-bold text-xs` (chuẩn ProductTable).
       - Xóa bỏ thẻ KPI "Tỷ lệ tương tác", giữ lại 2 thẻ gọn gàng: Tổng Người Theo Dõi & Mới Theo Dõi (`rounded-md`).
       - Bổ sung bộ lọc thời gian chọn ngày trong quá khứ (cuốn lịch / `<input type="date" />`) lọc các lượt theo dõi từ ngày đã chọn đến hiện tại kèm bộ nút chọn nhanh (Tất cả, 7 ngày qua), có pagination đầy đủ.
    2. **OrdersView (`OrdersView.tsx`)**:
       - Đồng bộ style `thead tr` sang `bg-brand-light-soft/50 text-brand-muted font-bold text-xs`.
       - Chuẩn hóa toàn bộ `rounded-xl` sang `rounded-md`.
       - Nhận props `{ customerId?: number; onBack?: () => void }` và hỗ trợ URL search param `?customerId=...`.
       - Hiển thị banner thông báo đang lọc đơn của khách hàng kèm nút "Quay lại người theo dõi" và nút "Xóa lọc".
    3. **Backend Follow Shop API (`Sellers.Api` & `Orders.Api`)**:
       - `FollowedShop.cs` & `Shop.cs`: Thêm Navigation Property `Shop` và `ICollection<FollowedShop> Followers`.
       - `SellerDbContext.cs`: Thiết lập ràng buộc khóa ngoại `HasOne(f => f.Shop).WithMany(s => s.Followers).HasForeignKey(f => f.ShopId).OnDelete(DeleteBehavior.Cascade)`.
       - **EF Core Migration**: Tạo và áp dụng migration `AddShopForeignKeyToFollowedShop` trên PostgreSQL `SellerDb`, tự động sinh Foreign Key constraint và Index trên `ShopId`.
       - `ShopService.cs`: Tối ưu `GetFollowedShopsAsync` sử dụng Navigation Property và subquery projection `f.Shop.Followers.Count()` trong 1 query SQL duy nhất (triệt tiêu hoàn toàn N+1 và loại bỏ các bước join / dictionary thủ công).
       - `ShopFollowersController.cs`: Cấp phép `[AllowAnonymous]` cho `CheckFollowStatus` và thêm endpoint `GET /api/shop/{shopId}/followers`, `GET /api/shop/{shopId}/followers-count`.
       - `Orders.Api`: Cập nhật `GetSubOrdersByShopQuery`, `GetSubOrdersByShopQueryHandler`, `OrdersController` hỗ trợ lọc theo `customerId`.
    4. **Thiết kế lại nút Follow Shop (`FollowShopButton.tsx` & `ShopProfilePublicPage.tsx`)**:
       - Thiết kế lại với Framer Motion, hiệu ứng chuyển động, trạng thái `Đang theo dõi` (hover đổi sang `Bỏ theo dõi`), spinner `Loader2` khi đang toggle, và badge hiển thị số lượng follower.
       - Tích hợp số lượng người theo dõi trên header của `ShopProfilePublicPage.tsx`.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Database Migration: `dotnet ef database update --project src/Services/Sellers/Ecommerce.Services.Sellers.Api --context SellerDbContext` -> Done.
    - Frontend: `npm run build` & `npx tsc --noEmit` -> Build succeeded (0 errors).

- [x] Nâng Cấp Toàn Diện Seller Center & Báo Cáo Thống Kê Doanh Thu (Đánh Giá Sản Phẩm Chọn Product Trước Kèm OrderId, Quản Lý Followers Kèm Lazy Order History Modal, Chat Trong Sidebar, Biểu Đồ Doanh Thu Spline Curve SVG, Filter Năm/Tháng/Hôm Nay/3 Ngày/Tuần/Sản Phẩm, Biểu Đồ Số Đơn & Hiệu Suất Từng Món, Bo Góc rounded-md, Thống Nhất Cho Cả Admin):
  - **Mục tiêu & Yêu cầu hoàn thành**:
    1. **Sidebar & Routing Seller (`SellerLayout.tsx`, `SellerDashboardPage.tsx`)**:
       - Thêm liên kết trực tiếp "Trò chuyện với khách" vào sidebar với icon `CommentOutlined`, trỏ trực tiếp đến trang chat hoàn chỉnh có sẵn (`/chat?seller=true`).
       - Bổ sung sublink "Đánh giá sản phẩm" (`/seller/dashboard/reviews`), "Người theo dõi" (`/seller/dashboard/followers`), và "Doanh thu" (`/seller/dashboard/revenue`).
       - Thay thế `Overview` cũ bằng việc trỏ mặc định vào dashboard doanh thu & thống kê hoàn chỉnh (`RevenueView`).
       - Chuẩn hóa breadcrumbs phản ánh chính xác từng trang chức năng.
    2. **Quản lý Đánh giá sản phẩm (`SellerReviewsView.tsx`)**:
       - Luồng chọn sản phẩm trước (Product-first): Hiển thị lưới sản phẩm với thumbnail, giá, điểm trung bình ⭐ và số lượng đánh giá để người bán chọn sản phẩm cần xem.
       - Khi chọn sản phẩm: Hiển thị tóm tắt sản phẩm, phân bổ mức sao, bộ lọc theo sao (Tất cả, 5, 4, 3, 2, 1), lọc trạng thái phản hồi (Tất cả, Chưa phản hồi, Đã phản hồi), ô tìm kiếm nội dung/mã đơn.
       - Từng đánh giá hiển thị thông tin người mua, ngày, phân loại hàng, **Mã đơn hàng liên kết (`orderId`, ví dụ: `#ORD-2026-98124`)** theo yêu cầu, ảnh đính kèm nếu có.
       - Khu vực Phản hồi người bán: Cho phép nhập và gửi phản hồi trực tiếp, hiển thị phản hồi đã gửi. Phân trang mượt mà.
    3. **Quản lý Khách hàng theo dõi (`SellerFollowersView.tsx`)**:
       - Hiển thị 3 KPI thống kê: Tổng người theo dõi, Mới theo dõi (30 ngày), Tỷ lệ tương tác.
       - Bảng danh sách followers với avatar, tên, username, ngày theo dõi, trạng thái hoạt động.
    4. **Báo cáo Doanh thu & Thống kê nâng cao (`ShopAnalyticsDashboard.tsx`, `RevenueView.tsx`)**:
       - Chuẩn hóa header & description đồng bộ với các trang khác trong Seller Center; **toàn bộ thẻ div/card dùng `rounded-md`**.
       - Bộ lọc đa năng: Preset nhanh ("Hôm nay", "3 ngày qua", "Tuần này", "Tháng này"), Dropdown Năm (trục X là tháng 1->12, tự ẩn tháng chưa diễn ra), Dropdown Tháng (trục X là ngày 1->28/30/31).
       - Dropdown lọc theo sản phẩm: "Tất cả sản phẩm" (mặc định) hoặc chọn từng sản phẩm cụ thể.
       - **Biểu đồ Spline Curve mượt mà (Cubic Bezier SVG)**: Hiển thị tiêu đề `Doanh Thu Tháng X: [Số tiền]đ` (số tiền nổi bật đỏ/accent giống ảnh mẫu), các mốc trục Y (0, 90k, 180k, 270k, 360k...), các điểm node có hiệu ứng phát sáng hover tooltip, legend `--o-- Doanh_thu`.
       - **Biểu đồ Thống kê Số lượng đơn đặt hàng**: Trend đơn hàng kèm phân bổ Hoàn thành / Đang giao / Đã hủy.
       - **Biểu đồ Hiệu suất từng món hàng**: 3 tabs chuyển đổi (Doanh thu từng món, Số đơn đặt hàng từng món, Số lượng sản phẩm bán được) với thanh progress bar trực quan.
       - Phân bổ kênh thanh toán: COD, Ví MoMo, VNPAY-QR, Ví Shop.
       - Tích hợp Mock Data engine phong phú cho phép quan sát trực quan ngay lập tức.
    5. **Thống nhất cho cả Admin (`AdminOverviewView.tsx`)**:
       - Tích hợp `ShopAnalyticsDashboard` vào Admin Overview kèm dropdown chọn xem theo từng shop hoặc toàn sàn.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` $\rightarrow$ ✅ Built in 923ms (0 errors); `npx tsc --noEmit` $\rightarrow$ ✅ Clean (0 errors).
