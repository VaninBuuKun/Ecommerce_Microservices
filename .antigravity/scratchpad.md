- [x] Phân Tách ShopAnalyticsDashboard Thành 6 Sub-Components, Đổi Vị Trí Search (Trái) & Filter (Phải), Sửa Lỗi Runtime selectedProduct, Tinh Gọn RevenueView & Bổ Sung Nút Phân Tích AdminShopsView:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Phân Tách Module `ShopAnalyticsDashboard.tsx` (Giảm từ 1442 dòng xuống ~320 dòng)**:
       - Tạo thư mục `src/domains/seller/components/analytics/` gồm 6 sub-components: `AnalyticsFilterBar.tsx`, `AnalyticsKpiCards.tsx`, `AnalyticsRevenueChart.tsx`, `AnalyticsOrderChart.tsx`, `AnalyticsProductPerformance.tsx`, `AnalyticsPaymentChannels.tsx`, và barrel `index.ts`.
       - Tuân thủ nghiêm ngặt quy tắc giới hạn độ dài component file (< 300 dòng).
    2. **Khắc Phục Lỗi Runtime Crash `selectedProduct is not defined`**:
       - Sửa lỗi tham chiếu sai biến trong menu chọn sản phẩm thành `selectedProductStat` được memoize an toàn.
    3. **Đổi Vị Trí Ô Tìm Kiếm (Trái) & Bộ Lọc (Phải) & Chuẩn Hóa Lowercase**:
       - Đưa ô tìm kiếm CSDL sang bên trái với debounce 300ms, nút "+ Thêm", và chuyển đổi chuỗi so sánh sang `.toLowerCase().trim()`.
       - Đưa bộ lọc thời gian và dropdown sản phẩm sang bên phải.
    4. **Tinh Gọn Thẻ KPI Doanh Thu**:
       - Xóa bỏ 4 thẻ số dư tích lũy tĩnh trong `RevenueView.tsx`. Toàn bộ dữ liệu hiển thị phụ thuộc 100% vào mốc thời gian được chọn.
       - Xóa thẻ "Doanh Thu Trung Bình" riêng biệt, tích hợp thành subtitle `TB ~...đ / ngày` dưới thẻ "Tổng Doanh Thu".
    5. **Tinh Gọn Giao Diện Admin & Bổ Sung Nút Phân Tích Gian Hàng**:
       - Trong `AdminOverviewView.tsx`: Xóa thẻ "Doanh Thu Toàn Sàn" ở dòng đầu; xóa ô select box chọn shop; hỗ trợ query `?shopId=...` từ URL kèm banner thông báo và nút "← Quay lại Toàn Sàn".
       - Trong `AdminShopsView.tsx`: Bổ sung nút hành động "Phân tích" (icon `BarChart3`) điều hướng trực tiếp sang `/admin/overview?shopId=${s.id}`.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend Build: `npm run build` -> Vite production build succeeded in 752ms (0 errors).

- [x] Tối Ưu Bộ Lọc Analytics (Dropdown Thời Gian Tự Chỉnh Tháng/Năm, Top 10 Sản Phẩm Bên Trái Có Thumbnail/ID/Tên, Tìm Kiếm CSDL Kèm Debounce 300ms Bên Phải), Sửa Điều Hướng Analyst Từ ProductView & Tinh Gọn SellerFollowersView:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Sửa Điều Hướng Phân Tích Trong Quản Lý Sản Phẩm (`ProductView.tsx`, `ProductTable.tsx`, `ProductRow.tsx`)**:
       - Khắc phục lỗi nút BarChart3 trong `ProductRow` điều hướng về `/seller?productId=...` (trang `SelectShopPage`).
       - Bổ sung prop `onAnalytics?: (id: string) => void` xuyên suốt từ `ProductView` -> `ProductTable` -> `ProductRow`.
       - Điều hướng chính xác và tức thì vào route dashboard của shop: `/seller/${targetShopId}/dashboard/revenue?productId=${productId}` (hoặc `/seller/dashboard/revenue?productId=${productId}`).
    2. **Thiết Kế Lại Bộ Lọc Trong `ShopAnalyticsDashboard.tsx`**:
       - **Gom Nhóm Thời Gian Thành Dropdown `<select>` Bên Trái**: Tùy chọn gồm "Hôm nay", "3 ngày qua", "7 ngày qua", và "Tự chỉnh".
       - **Chế Độ "Tự Chỉnh"**:
         - Khi chọn "Tự chỉnh", biểu đồ tạm thời ẩn đi và hiển thị card hướng dẫn thân thiện yêu cầu người dùng chọn Tháng (1..12) và Năm xuất hiện ở ngay bên dưới.
         - Người dùng bấm "Xem phân tích" / "Cập nhật biểu đồ" thì mới kích hoạt gọi API vẽ đường cong Spline Curve và hiển thị KPI.
         - Khi chọn "Hôm nay", "3 ngày qua", "7 ngày qua", ẩn hoàn toàn bộ lọc Tháng/Năm bên dưới và hiển thị biểu đồ ngay lập tức.
       - **Bộ Lọc Sản Phẩm (Top 10 Của Shop) Đưa Sang Bên Trái**:
         - Thiết kế Custom Dropdown hiển thị đầy đủ: Ảnh thu nhỏ (Thumbnail), Tên sản phẩm, và Huy hiệu ID (`#ID`) cùng số lượng đã bán / doanh thu giống như lúc tìm kiếm.
         - Bao gồm tùy chọn "Tất cả sản phẩm" và danh sách các sản phẩm bổ sung từ tìm kiếm CSDL.
       - **Tìm Kiếm Sản Phẩm CSDL Ở Bên Phải**:
         - Tích hợp ô input tìm kiếm với Debounce (300ms), gọi API `productApi.getMyProducts` / `productApi.getProducts` / `productApi.getProductById`.
         - Danh sách kết quả hiển thị hình ảnh thu nhỏ, tên sản phẩm, mã ID, giá bán và nút "+ Thêm".
         - Nhấn "+ Thêm" sẽ lập tức chèn sản phẩm vào danh sách lọc của shop, kích hoạt chọn lọc ngay và xóa ô tìm kiếm kèm thông báo Toast.
       - **Phản Ứng Nhanh Với Query URL `?productId=...`**:
         - Sử dụng `useLocation()` từ `react-router-dom` phản ứng ngay lập tức với thay đổi URL, tự động truy vấn thông tin sản phẩm từ CSDL để hiển thị tên và thumbnail đầy đủ vào bộ lọc.
    3. **Tinh Gọn Bộ Lọc Trong `SellerFollowersView.tsx`**:
       - Xóa bỏ hoàn toàn cột và giá trị "Hoạt động gần nhất" khỏi header và từng hàng trong bảng.
       - Xóa 2 nút lọc nhanh "Tất cả" và "7 ngày qua", xóa hàm `handleQuickFilter`.
       - Mặc định khi chưa chọn lịch là hiển thị tất cả. Khi chọn ngày trên cuốn lịch, ngày đó sẽ được dùng làm ngày bắt đầu lọc (từ ngày chọn đến nay).
    4. **Chuẩn Hóa & Tổng Quan Hóa `readme.md`**:
       - Xóa bỏ toàn bộ các chi tiết vi mô (tên class CSS, công thức SVG, tên file nội bộ, debounce ms) bị ghi chép tùy tiện.
       - Cập nhật lại Mục 3 thành cái nhìn tổng quan, mạch lạc, chuyên nghiệp về toàn bộ năng lực & tính năng của web (Khách hàng, Người bán, Quản trị viên, và Nền tảng kỹ thuật xuyên suốt).
  - **Kiểm Thử & Biên Dịch**:
    - Frontend Build: `npm run build` -> Vite production build succeeded in 736ms (0 errors).

- [x] Khắc Phục Triệt Để Hiển Thị Doanh Thu Analytics (Number Parsing), Snapshot ProductName & Thumbnail Vào ShopProductStats (EF Migration), Tối Ưu Tính Tiền Doanh Thu Shop Không Gồm Phí Ship, Invalidate Cache Sau Khi Checkout & Bộ Lọc Top 25 Kèm Nhập Product ID:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Khắc Phục Lỗi Hiển Thị Doanh Thu Chuỗi `000000000000393580đ` (`sellerAnalyticsApi.ts`, `adminAnalyticsApi.ts`, `ShopAnalyticsDashboard.tsx`)**:
       - Nguyên nhân gốc: Do `LongToStringJsonConverter` serialize toàn bộ kiểu `long` thành chuỗi trong JSON, hàm `.reduce((sum, p) => sum + p.revenue, 0)` trong JavaScript đã thực hiện phép nối chuỗi (String Concatenation) qua 30 ngày dẫn đến chuỗi `"000000000000393580"`.
       - Giải pháp: Ép kiểu `Number(...)` toàn bộ các trường tài chính (`revenue`, `todayRevenue`, `monthRevenue`, `orderCount`, `soldQuantity`, `platformRevenue`, `totalGmv`, `netRevenue`) ngay tại tầng API Client phía frontend và bao bọc phòng thủ tại `reduce()` trong component.
    2. **Đồng Bộ Dữ Liệu Tên & Thumbnail Sản Phẩm Trong Analytics (Option A - Snapshot Bất Biến)**:
       - `SubOrderCompletedItemContract` (`SubOrderCompletedEvent.cs`): Bổ sung các trường `UnitPrice`, `ProductName`, và `ThumbnailUrl`.
       - `CompleteSubOrderCommandHandler.cs`, `AutoCompleteOrdersBackgroundService.cs`, `OrderJobService.cs`: Map chính xác `UnitPrice`, `ProductName`, `ThumbnailUrl` từ `SubOrderItem` sang integration event khi hoàn tất đơn hàng.
       - `ShopProductStats.cs` (`Analytics.Api`): Bổ sung 2 cột `ProductName` và `ThumbnailUrl`. Cấu hình Fluent API trong `AnalyticsDbContext`.
       - **EF Core Migration**: Tạo và áp dụng thành công migration `Add_Product_Name_And_Thumbnail_To_ShopProductStats` trên database PostgreSQL `AnalyticsDb`.
       - `SubOrderCompletedAnalyticsConsumer.cs`: Snapshot `ProductName` và `ThumbnailUrl` khi upsert vào `ShopProductStats`. Phân bổ doanh thu của từng sản phẩm theo tỷ lệ `(itemSubTotal / totalItemsSubTotal) * actualShopRevenue`, tránh việc nhân đôi doanh thu toàn đơn vào từng sản phẩm.
       - `SellerAnalyticsService.cs` & `AdminAnalyticsService.cs`: Trả về tên thật của sản phẩm và URL thumbnail thay vì hardcode chuỗi `Sản phẩm #{id}`.
    3. **Chuẩn Hóa Kế Toán & Doanh Thu Người Bán (Tiền Ship Do Sàn Thu Để Trả Bên Thứ 3)**:
       - `SubOrder.cs`: Cập nhật `NetRevenue => Math.Max(0, (SubTotal - SellerDiscount) - CommissionFee)`. Tiền hàng thực nhận của shop chỉ là tiền hàng sau giảm giá trừ đi phí hoa hồng sàn, **không bao gồm tiền ship**.
       - `CreateOrderCommandHandler.cs`: Phí hoa hồng sàn snapshot `CommissionFee` chỉ tính trên giá trị hàng hóa của shop `SubTotal - SellerDiscount`, không tính trên phí vận chuyển.
    4. **Invalidate Cache Sau Khi Checkout (`CheckoutPage.tsx`, `useOrders.ts`)**:
       - Bổ sung `queryClient.invalidateQueries({ queryKey: ["customerOrders"] })`, `["orders"]`, và `["cart"]` trong cả `useCheckoutMutation` và callback `onSuccess` của `CheckoutPage.tsx`. Đảm bảo khi khách chuyển sang tab Quản lý đơn hàng sẽ lập tức tải danh sách đơn mới nhất mà không bị vướng cache cũ.
    5. **Nâng Cấp Bộ Lọc Top 25 Kèm Nhập Product ID Tự Động Thêm Vào Select (`ShopAnalyticsDashboard.tsx`)**:
       - Mở rộng giới hạn lấy top sản phẩm hot lên **25 sản phẩm** cho cả Seller và Admin.
       - Bổ sung ô nhập liệu Product ID kèm nút "Thêm": Khi người dùng gõ bất kỳ ID sản phẩm nào, hệ thống tự động thêm sản phẩm đó vào danh sách Select và kích hoạt bộ lọc chi tiết cho sản phẩm đó.
       - Hỗ trợ URL query param `?productId=...` tự động chọn và lọc sản phẩm khi truy cập từ liên kết ngoài.
       - Hiển thị thumbnail thật của sản phẩm và tiêu đề có liên kết mở trang chi tiết sản phẩm `/products/:id` trong bảng xếp hạng hiệu suất.
    6. **Bổ Sung Thao Tác "Xem Phân Tích" Tại Trang Quản Lý Sản Phẩm (`ProductRow.tsx`, `AdminProductsView.tsx`)**:
       - Thêm nút icon biểu đồ `BarChart3` tại danh sách sản phẩm của Seller (`/seller?productId=${product.id}`) và Admin (`/admin/overview?productId=${p.id}`) cho phép chuyển nhanh đến bảng thống kê sản phẩm.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Database Migration: `dotnet ef database update --project src/Services/Analytics/Ecommerce.Services.Analytics.Api --context AnalyticsDbContext` -> Done.
    - Frontend: `npm run build` -> Vite production build succeeded in 810ms (0 errors).

- [x] Tối Ưu Triệt Để Khởi Tạo SignalR (Singleton Lock, Dynamic Token), Đợi Đồng Thời 2 API (SubOrderDetail + Shipment) Ở CustomerOrderDetailView & Điều Hướng Đến ProductDetailPage:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Sửa Triệt Để `useSignalR.ts` (L157)**:
       - Thay thế cơ chế cờ boolean `isStarting` và vòng lặp `setTimeout` dễ gây race condition bằng `startPromise: Promise<signalR.HubConnection | null> | null` singleton lock.
       - Tách biệt hàm `createConnection()` gắn sẵn toàn bộ listener (`ForceLogout`, reconnecting, reconnected, close) dùng chung cho cả hook `useSignalR` và helper `ensureSignalRConnected`.
       - Khắc phục lỗi token stale: Thay thế `accessTokenFactory: () => token` bằng hàm đọc động `accessTokenFactory: () => localStorage.getItem("accessToken") || ""` để luôn gửi JWT mới nhất sau khi refresh.
       - Đảm bảo các lần gọi đồng thời của `ensureSignalRConnected` không bao giờ bị rơi vào nhánh null ở cuối hàm.
    2. **Đợi Đồng Thời 2 API Ở `CustomerOrderDetailView.tsx`**:
       - Cập nhật điều kiện hiển thị loading: `if (isLoading || isShipmentLoading)` để component chỉ render giao diện khi CẢ HAI API (`useSubOrderDetailQuery` và `useShipmentBySubOrderQuery`) đều đã tải xong dữ liệu, loại bỏ hiện tượng giật giao diện khi shipment tải chậm hơn.
    3. **Điều Hướng Sang `ProductDetailPage` Khi Click ProductItem**:
       - `ProfileOrderTabs.tsx`: Thêm sự kiện `onClick={() => navigate('/products/' + item.productId)}` trên cả hình ảnh thumbnail và tiêu đề sản phẩm, bổ sung style hover (`cursor-pointer hover:text-brand-primary`, `hover:opacity-85`).
       - `CustomerOrderDetailView.tsx`: Thêm sự kiện `onClick={() => navigate('/products/' + item.productId)}` trên cả hình ảnh thumbnail và tiêu đề sản phẩm trong bảng chi tiết đơn hàng.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Frontend: `npm run build` & `npx tsc --noEmit` -> Build succeeded (0 errors).

- [x] Khắc Phục Triệt Để Lưu Cache & State Khi Đăng Xuất Đổi Tài Khoản, Ngăn Chặn Rò Rỉ Dữ Liệu Khách Hàng (React Query, Zustand, SignalR, Orders Controller) & Phân Định Rõ Ràng Địa Chỉ Nhận Hàng Trong Order:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Làm Rõ Kiến Trúc Địa Chỉ Giao Nhận Hàng (`Order.ShippingAddress` vs `Shipment.PickUpAddress`)**:
       - `Order.ShippingAddress`, `RecipientName`, `RecipientPhone`, `RecipientWardId` là **Snapshot địa chỉ giao hàng của người mua (Buyer's Delivery Address)** tại thời điểm chốt đơn. Đây là dữ liệu bất biến (immutable) phục vụ giao hàng, in phiếu gửi, hóa đơn và hiển thị chi tiết đơn hàng (`GetSubOrderDetailQueryHandler`), **TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA**.
       - Địa chỉ kho lấy hàng của người bán (Seller's PickUp Address) đã được tách rời hoàn toàn sang `Sellers.Api` (`PickUpAddress`) và `Shippings.Api` (`Shipment`).
    2. **Xóa Sạch Cache & Invalidation Khi Đăng Xuất Đổi Tài Khoản (`frontend-web`)**:
       - `useAuthStore.ts`: Bổ sung `queryClient.clear()` vào hàm `clearState()` nhằm xóa triệt để toàn bộ in-memory cache của TanStack Query (`["cart"]`, `["order", "addresses"]`, `["userWallet"]`, `["customerOrders"]`, `["userBankAccounts"]`, ...) ngay khi người dùng đăng xuất hoặc token hết hạn.
       - `useSignalR.ts`: Export hàm `stopSignalRConnection()` để chủ động ngắt kết nối WebSocket SignalR của tài khoản cũ, tránh nhận nhầm sự kiện thông báo của user trước.
       - `authApi.ts`: Nâng cấp hàm `logout()`:
         - Xóa session auth: `useAuthStore.getState().clearState()`.
         - Reset Seller state: `useSellerStore.getState().setActiveShop(null)`.
         - Reset Chat state & dọn sạch localStorage liên quan đến chat (`buu_chat_is_seller`, `buu_chat_selected_shop`, `buu_chat_active_room_id`).
         - Ngắt SignalR: `stopSignalRConnection()`.
    3. **Sửa Lỗi IDOR & Hardcode CustomerId Ở Đơn Hàng (`ProfileOrderTabs.tsx`, `useOrders.ts`, `OrdersController.cs`)**:
       - `ProfileOrderTabs.tsx`: Xóa bỏ đoạn hardcode `customerId || 1` dẫn đến việc tài khoản mới luôn bị ép tải đơn của khách hàng ID 1. Sử dụng `effectiveCustomerId = customerId ?? (user?.id ? Number(user.id) : undefined)`.
       - `useOrders.ts`: Bổ sung điều kiện `enabled: Boolean(customerId && customerId > 0)` cho `useCustomerOrdersQuery` để không bao giờ bắn request với `customerId` rỗng hoặc không hợp lệ. Xóa bỏ fallback gọi nhầm API customer 1 trong `useAdminSubOrdersQuery`.
       - `OrdersController.cs`: Gia cố bảo mật API `GET /api/orders/customer/{customerId}`. Nếu không phải Admin, backend ép buộc lấy dữ liệu theo `UserId` trích xuất từ JWT token (`targetCustomerId = (customerId > 0 && isAdmin) ? customerId : UserId;`), ngăn chặn tuyệt đối việc người dùng xem trộm đơn hàng của tài khoản khác.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build src/Services/Orders/Ecommerce.Services.Orders.Api/Ecommerce.Services.Orders.Api.csproj` -> Build succeeded (0 errors).
    - Frontend: `npm run build` -> Vite build succeeded (0 errors).

- [x] Snapshot ShopName & ShopLogoUrl Vào SubOrder (Orders Service), Tách Biệt Độc Lập Với Shippings & Tối Ưu Truy Vấn Chi Tiết Đơn Hàng Song Song:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Kiến trúc Snapshot Định Danh Cửa Hàng (`Orders.Domain` & `Orders.Infrastructure`)**:
       - `SubOrder.cs`: Bổ sung 2 trường snapshot `ShopName` (string, max 255) và `ShopLogoUrl` (string?, max 500) cùng method nghiệp vụ `SetShopInfo(string shopName, string? shopLogoUrl)`.
       - `Order.cs`: Bổ sung method aggregate root `SetShopInfo(long shopId, string shopName, string? shopLogoUrl)`.
       - `OrderDbContext.cs`: Cấu hình EF Core mapping Fluent API cho 2 cột mới trong bảng `SubOrders`.
       - **EF Core Migration**: Tạo và áp dụng thành công migration `Add_ShopName_And_Logo_To_SubOrder` vào PostgreSQL `OrdersDb`.
       - Tuyệt đối không snapshot địa chỉ lấy hàng của Shop vào `SubOrder` nhằm giữ đúng nguyên tắc Single Responsibility (địa chỉ lấy hàng do `Shipment` bên Shippings Service quản lý độc lập).
    2. **Luồng Dữ Liệu Checkout & Tạo Đơn (`Orders.Application` & `Orders.Infrastructure`)**:
       - `ShopShippingInfoDto.cs`: Bổ sung trường `LogoUrl`.
       - `SellerClientService.cs`: Map trường `LogoUrl` từ gRPC response (`GetShopShippingInfoAsync` & `GetShopsShippingInfoAsync`).
       - `CheckoutSession.cs`: Bổ sung `ShopNames` (`Dictionary<long, string>`) và `ShopLogoUrls` (`Dictionary<long, string?>`).
       - `CalOrderGrandTotalCommandHandler.cs`: Lưu trữ thông tin `ShopNames` và `ShopLogoUrls` từ kết quả gọi gRPC lấy thông tin vận chuyển các shop vào Redis session.
       - `CreateOrderCommandHandler.cs`: Đọc `ShopNames` và `ShopLogoUrls` từ `CheckoutSession` và snapshot vĩnh viễn vào từng `SubOrder` khi tạo đơn hàng (triệt tiêu 100% nhu cầu gọi gRPC sang Sellers Service khi người mua/bán query đơn sau này).
    3. **Tối Ưu Query DTOs & Phản Hồi API**:
       - `CustomerOrderResponse.cs`: Bổ sung `ShopLogoUrl`.
       - `GetSubOrdersQuery.cs`: Thay thế logic hardcode `ShopId == 4` bằng việc đọc trực tiếp `o.ShopName` snapshot và map `ShopLogoUrl = o.ShopLogoUrl`.
       - `SubOrderDetailDto.cs` & `GetSubOrderDetailQueryHandler.cs`: Bổ sung `ShopName` và `ShopLogoUrl`.
    4. **Frontend Integration & UX Nâng Cấp (`frontend-web`)**:
       - `order.types.ts`: Chuẩn hóa `CustomerOrderItemDto`, `CustomerOrderResponse`, và `SubOrderDetailDto` đầy đủ các trường `shopName` và `shopLogoUrl`.
       - `ProfileOrderTabs.tsx`: Hiển thị logo cửa hàng (`shopLogoUrl`) dạng avatar bo tròn kế bên tên shop ở header từng đơn hàng trong danh sách "Đơn hàng của tôi" (kèm fallback icon `Store`).
       - `CustomerOrderDetailView.tsx`:
         - Giữ vững kiến trúc gọi 2 API song song phía client (`useSubOrderDetailQuery` + `useShipmentBySubOrderQuery`): Đảm bảo tách biệt domain, tốc độ phản hồi tối đa qua HTTP/2, và khả năng chịu lỗi (resilience) cao khi Shippings hoặc GHN có độ trễ/lỗi thì chi tiết đơn hàng vẫn hiển thị ngay lập tức.
         - Thêm Shop Info Banner nổi bật phía trên bảng sản phẩm: Hiển thị logo shop, tên shop, ID shop và nút "Chat với nhà bán".
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Database Migration: `dotnet ef database update --project src/Services/Orders/Ecommerce.Services.Orders.Infrastructure --startup-project src/Services/Orders/Ecommerce.Services.Orders.Api --context OrderDbContext` -> Done.
    - Frontend: `npm run build` -> Vite production build succeeded in 774ms (0 errors).

- [x] Xóa Bỏ Hoàn Toàn Mock Data Trong AdminOverviewView & ShopAnalyticsDashboard, Kết Nối Trực Tiếp API Thật Backend (Analytics.Api & Sellers.Api):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Backend Analytics Service (`Ecommerce.Services.Analytics.Api`)**:
       - `IAdminAnalyticsService` & `AdminAnalyticsService.cs`:
         - Bổ sung tham số `int? year = null, int? month = null` cho `GetRevenueChartAsync`: Hỗ trợ tổng hợp theo 12 tháng khi lọc theo năm, và chi tiết từng ngày trong tháng khi lọc theo tháng cụ thể.
         - Xóa bỏ các giá trị gán giả định (fallback `13` shops, `85` orders), phản ánh số liệu thực tế 100% từ database.
         - Triển khai `GetTopProductsAsync(limit)`: Tổng hợp các sản phẩm bán chạy nhất toàn sàn từ `ShopProductStats`.
       - `ISellerAnalyticsService` & `SellerAnalyticsService.cs`:
         - Bổ sung tham số `int? year = null, int? month = null` cho `GetRevenueChartAsync` của từng Shop.
         - Xóa bỏ các giá trị fallback giả định trong `GetOverviewAsync` (`AverageRating = 5.0, TotalFollowers = 0, TotalProducts = totalProducts`).
       - `AdminAnalyticsController` & `SellerAnalyticsController`:
         - Thêm query parameters `year` và `month` cho endpoint `GET /revenue-chart`.
         - Bổ sung endpoint `GET /api/analytics/admin/top-products` cho quản trị viên toàn sàn.
    2. **Frontend Admin & Seller Domain APIs (`adminAnalyticsApi.ts`, `sellerAnalyticsApi.ts`)**:
       - Xóa bỏ hoàn toàn các file mock `mockAdminAnalytics.ts` và `mockSellerAnalytics.ts`.
       - Xóa bỏ cơ chế fallback trả về mock data khi gọi API thất bại; trả về cấu trúc rỗng sạch sẽ (`[]`, số liệu `0`).
       - Bổ sung `getTopProducts` cho Admin Analytics API.
    3. **Frontend Admin Overview (`AdminOverviewView.tsx`)**:
       - Xóa bỏ danh sách shop giả định `ADMIN_SHOPS_LIST = [...]`.
       - Tích hợp hook `useAdminShopsQuery({ pageSize: 100 })` từ Sellers API thực tế, tự động populate danh sách shop và tên shop khi Admin chuyển đổi xem từng shop hoặc xem toàn sàn.
       - Hiển thị tổng số lượng shop chính xác từ kết quả truy vấn.
    4. **Frontend Analytics Dashboard Engine (`ShopAnalyticsDashboard.tsx`)**:
       - Xóa bỏ hoàn toàn danh sách sản phẩm mẫu `SAMPLE_PRODUCTS` và thuật toán nhân tỉ lệ ngẫu nhiên.
       - Tích hợp hook `useAdminRevenueChartQuery` / `useSellerRevenueChartQuery` truyền tham số linh hoạt (`today`, `3d`, `7d`, `year`, `custom_month`).
       - Tích hợp `useSellerTopProductsQuery` / `useAdminTopProductsQuery`: Tự động điền dropdown "Lọc sản phẩm" và danh sách "Hiệu suất từng món hàng" với dữ liệu bán hàng thực tế từ backend.
       - Xử lý các trạng thái rỗng (Empty State) và trạng thái tải dữ liệu (Loading Spinner) chuyên nghiệp khi chưa phát sinh giao dịch.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build src/Services/Analytics/Ecommerce.Services.Analytics.Api/Ecommerce.Services.Analytics.Api.csproj` -> Build succeeded (0 errors).
    - Frontend: `npx tsc --noEmit` & `npm run build` -> Build succeeded (0 errors).

- [x] Nâng Cấp Modal Quản Lý Tài Khoản Ngân Hàng: Bổ Sung Chức Năng Xóa Tài Khoản (Backend + Frontend), Mở Rộng Kích Thước Modal (max-w-2xl), Hiển Thị Logo Dưới Ô Chọn Kèm Checkbox Đặt Mặc Định Bên Phải:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Backend Payments Service (`WalletService.cs`, `WalletController.cs`, `IWalletService.cs`)**:
       - Triển khai phương thức `DeleteBankAccount(userId, bankAccountId)` trong `WalletService`:
         - Kiểm tra quyền sở hữu tài khoản thuộc về ví người dùng.
         - Ràng buộc an toàn: Không cho phép xóa tài khoản ngân hàng duy nhất (yêu cầu thêm tài khoản mới trước khi xóa).
         - Tự động chuyển một tài khoản còn lại thành mặc định nếu tài khoản bị xóa đang là mặc định.
       - Thêm API endpoint `DELETE /api/wallet/bank-accounts/{id:long}` trong `WalletController`.
    2. **Frontend Web (`BankAccountManagerModal.tsx`, `WalletTab.tsx`, `orderApi.ts`, `walletApi.ts`, `useOrders.ts`)**:
       - Thêm hàm gọi API `deleteBankAccount` trong cả `orderApi.ts` và `walletApi.ts`.
       - Tạo hook mutation `useDeleteBankAccountMutation` với cơ chế invalidate query `["userBankAccounts"]`.
       - Mở rộng kích thước Modal: Tăng từ `max-w-xl` lên `max-w-2xl`, tạo không gian thoáng đãng và trực quan.
        - Tái cấu trúc Layout Form Thêm/Sửa thành 1 hàng duy nhất bên dưới các ô nhập liệu:
          - Dưới ô select: Ô hiển thị logo ngân hàng (w-10 h-10 object-contain).
          - Kế bên phải: Checkbox "Đặt làm mặc định".
          - Phải cùng: Bộ nút "Hủy" và "Xác nhận".
        - Thêm nút Xóa với icon `Trash2` (màu đỏ nhẹ rose-50, hover rose-100) kế bên nút "Sửa" cho từng dòng tài khoản trong danh sách kèm xác nhận và trạng thái `deletePending`.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Frontend: `npx tsc --noEmit` & `npm run build` -> Build succeeded in 1.11s (0 errors).

- [x] Bổ Sung IconUrl Cho Danh Sách Ngân Hàng Hỗ Trợ Tại WalletService & Hiển Thị Logo Ngân Hàng Trong BankAccountManagerModal:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Backend Payments Service (`WalletService.cs`, `WithdrawalService.cs`, `WalletController.cs`)**:
       - Cấu trúc lại `AllowedBanks` trong `WalletService.cs` từ `HashSet<string>` thành `Dictionary<string, SupportedBankInfo>` với đầy đủ `Name`, `Code`, và `IconUrl` từ CDN VietQR (Vietcombank, Techcombank, MB Bank, ACB, BIDV, VietinBank, Agribank, Sacombank, VPBank, TPBank, VIB, HDBank).
       - Thêm helper method `GetBankIconUrl(string? bankName)` tra cứu logo nhanh chóng theo tên ngân hàng.
       - Cập nhật `BankAccountDto.cs` và `WithdrawalRequestDto.cs` bổ sung trường `IconUrl`.
       - Tự động map `dto.IconUrl = GetBankIconUrl(bankAccount.BankName)` trong các hàm `AddBankAccount`, `GetBankAccounts`, `UpdateBankAccount`, `CreateWithdrawal`, `GetMyWithdrawals`, `GetAllWithdrawals`.
       - Thêm endpoint `GET /api/wallet/supported-banks` (`[AllowAnonymous]`) trả về danh sách ngân hàng hỗ trợ kèm logo và mã code.
    2. **Frontend Web (`BankAccountManagerModal.tsx`, `BankAccountCard.tsx`, `WithdrawRequestModal.tsx`, `wallet.types.ts`)**:
       - `wallet.types.ts`: Bổ sung `iconUrl?: string` cho `BankAccountDto` và `WithdrawalRequestDto`.
       - `BankAccountManagerModal.tsx`:
         - Hiển thị logo ngân hàng (`acc.iconUrl || matchedBank?.logo`) với bo góc `rounded-md`, border chuẩn, background `bg-slate-50`, và `onError` fallback an toàn trong danh sách tài khoản.
         - Thêm xem trước (preview thumbnail) logo ngân hàng ngay cạnh dropdown khi người dùng chọn ngân hàng lúc thêm mới hoặc chỉnh sửa tài khoản.
       - `BankAccountCard.tsx`: Hiển thị logo ngân hàng kế bên tên ngân hàng ở thẻ "Tài khoản mặc định".
       - `WithdrawRequestModal.tsx`: Hiển thị logo ngân hàng tại khối "Tài khoản nhận tiền mặc định" khi tạo yêu cầu rút tiền.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Frontend: `npx tsc --noEmit` & `npm run build` -> Build succeeded in 822ms (0 errors).

- [x] Xây Dựng & Chuẩn Hóa Bộ Tiêu Chuẩn Đặt Tên Git Commit Cho Dự Án (docs/COMMIT_CONVENTION.md):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Tài liệu chuẩn hóa (`docs/COMMIT_CONVENTION.md`)**:
       - Soạn thảo bộ quy chuẩn đặt tên Git Commit toàn diện theo chuẩn **Conventional Commits v1.0.0**.
       - Định nghĩa chi tiết cấu trúc 3 phần: `<type>(<scope>): <subject>`, `[optional body]`, `[optional footer(s)]`.
       - Định nghĩa danh sách commit `type` (`feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`, `build`, `ci`, `revert`) kèm phân loại tác động Semantic Versioning.
       - Định nghĩa danh mục `scope` cụ thể, sát sườn với kiến trúc dự án:
         - Backend Microservices: `catalog`, `cart`, `orders`, `identity`, `sellers`, `payments`, `shippings`, `notifications`, `recommendations`, `analytics`, `gateway`, `buildingblocks`.
         - Frontend Web: `customer-ui`, `seller-ui`, `admin-ui`, `auth-ui`, `shared-ui`, domain scopes (`domain-cart`, `domain-order`, ...).
         - Hạ tầng & DB: `db`, `docker`, `telemetry`, `rabbitmq`.
         - Tài liệu & Cấu hình: `docs`, `readme`, `config`.
       - Quy tắc viết Subject: Thể mệnh lệnh (imperative mood), viết thường, không có dấu chấm câu cuối, quy tắc độ dài 50/72.
       - Quy tắc Breaking Changes (`!` hoặc `BREAKING CHANGE:`) và liên kết issue/PR footers (`Closes #123`, `Refs #456`).
       - Bảng so sánh commit Sai (Bad) vs Đúng (Good) kèm giải thích chi tiết.
       - Ví dụ thực tế gắn liền với CQRS MediatR, gRPC, EF Core Migrations, và React 19 Frontend.
       - Quy chuẩn đặt tên Git Branch: `feature/*`, `fix/*`, `refactor/*`, `perf/*`, `docs/*`, `hotfix/*`.
       - Kèm script Bash Git Hook mẫu (`.git/hooks/commit-msg`) để tự động kiểm tra cú pháp commit trên máy lập trình viên.
    2. **Đồng bộ tài liệu dự án**:
       - Cập nhật [readme.md](file:///home/vanmuzic/Projects/Ecommerce_Microservices/readme.md) với mục *Documentation & Guidelines* dẫn tới `docs/COMMIT_CONVENTION.md`.
       - Cập nhật [.agents/rules/02_coding_standards.md](file:///home/vanmuzic/Projects/Ecommerce_Microservices/.agents/rules/02_coding_standards.md) với mục quy chuẩn Git Commit & Branching.

- [x] Tối Ưu Hóa Query Tổng Hợp Trong Analytics Service (Gom 6 Query Sum/Select Riêng Biệt Thành 1 Câu SQL Duy Nhất Với GroupBy(_ => 1)):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Tối ưu AdminAnalyticsService (`AdminAnalyticsService.cs`)**:
       - Trước đây: `GetOverviewAsync` thực hiện tới 7 lệnh `await` riêng biệt (1 lệnh đếm số shop qua gRPC + 5 lệnh `SumAsync` độc lập trên `DailyPlatformRevenues` + 1 lệnh `FirstOrDefaultAsync` lấy số liệu hôm nay). Dẫn đến 6 round-trip mạng tới PostgreSQL dù đều cùng truy vấn trên 1 bảng `DailyPlatformRevenues`.
       - Sau khi tối ưu: Gom toàn bộ 6 câu query trên bảng `DailyPlatformRevenues` thành **1 câu SQL duy nhất** thông qua EF Core `GroupBy(_ => 1)`.
       - PostgreSQL biên dịch thành 1 câu SQL `SELECT COALESCE(sum(...), 0)... COALESCE(sum(CASE WHEN "Date" = @today THEN ... ELSE 0 END), 0) FROM "DailyPlatformRevenues" GROUP BY 1`.
       - Giảm từ 7 `await` xuống còn đúng **2 `await`** (1 gRPC đếm shop + 1 SQL query duy nhất trên AnalyticsDb), giảm 83% round-trip I/O.
    2. **Tối ưu SellerAnalyticsService (`SellerAnalyticsService.cs`)**:
       - Trước đây: `GetOverviewAsync` gọi 3 query riêng biệt tới `DailyShopRevenues` (`todayStat`, `monthRevenue`, `totalOrders`).
       - Sau khi tối ưu: Gom thành 1 query `GroupBy(_ => 1)` có điều kiện (conditional sum theo `Date = today` và `Date >= monthStart`), giảm từ 4 `await` xuống còn **2 `await`**.
  - **Kiểm Thử & Biên Dịch**:
    - Solution Build: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Đã xác thực SQL execution translation trên PostgreSQL `AnalyticsDb`.

- [x] Thống Nhất Kích Thước Title & Description Cho Tất Cả Các Views Admin Theo Chuẩn AdminBannersView (text-4 / text-[12px]):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Chuẩn hóa Header & Typography Toàn Bộ 14 Admin Views**:
       - `index.css`: Bổ sung `@utility text-4 { font-size: 14px; line-height: 1.25rem; }` trong Tailwind CSS v4, đảm bảo class `text-4` tạo ra font-size 14px chuẩn xác và đồng nhất 100%.
       - `AdminOverviewView.tsx`: Căn chỉnh lại Header đồng bộ với các view khác: Title viết hoa `text-4 font-black text-brand-dark uppercase tracking-wider` ("TỔNG QUAN & THỐNG KÊ HỆ THỐNG") và Description `text-[12px] text-brand-muted font-bold mt-0.5`.
       - Đồng bộ toàn diện 13 Admin Views còn lại (`AdminBannersView`, `AdminCategoriesView`, `AdminKycView`, `AdminOrdersView`, `AdminPaymentMethodsView`, `AdminProductsView`, `AdminRefundsView`, `AdminShipmentsView`, `AdminShopsView`, `AdminUsersView`, `AdminVouchersView`, `AdminWalletsDashboardView`, `AdminWithdrawsView`):
         - Title: `text-4 font-black text-brand-dark uppercase tracking-wider`
         - Description: `text-[12px] text-brand-muted font-bold mt-0.5`
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` -> Vite production build succeeded in 692ms (0 errors).

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
