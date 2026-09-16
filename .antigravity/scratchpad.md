- [x] Sửa Lỗi GHN API "Tên hàng hoá bắt buộc" Khi Tạo Vận Đơn Hoàn Trả (Reverse Logistics), Phòng Thủ 3 Lớp & Ngăn Chặn SubOrderRejectedEvent Sai Trạng Thái:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Nguyên nhân gốc rễ**: Khi Seller duyệt hoàn tiền, [ApproveRefundCommandHandler.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Orders/Ecommerce.Services.Orders.Application/Features/Orders/Commands/ApproveRefund/ApproveRefundCommandHandler.cs) bắn `CreateShipmentRequest` với `IsRefund = true` nhưng để `Items` rỗng. [CreateShipmentConsumer.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Shippings/Ecommerce.Services.Shippings.Api/Consumers/CreateShipmentConsumer.cs) map sang mảng rỗng `[]` và [GhnShippingProvider.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Shippings/Ecommerce.Services.Shippings.Api/Services/GhnShippingProvider.cs) gửi `items: []` lên GHN API, khiến GHN trả về lỗi 400 `"Tên hàng hoá bắt buộc"`.
    2. **Khắc phục 3 lớp phòng thủ (Defensive Programming)**:
       - **Lớp 1 (Publisher)**: `ApproveRefundCommandHandler` truyền đầy đủ `subOrderItems` vào `CreateShipmentRequest.Items`.
       - **Lớp 2 (Consumer)**: `CreateShipmentConsumer` kiểm tra nếu `Items` rỗng thì tự động fallback item đại diện `$"Hàng hoàn trả - Đơn #{message.SubOrderId}"`.
       - **Lớp 3 (Provider)**: `GhnShippingProvider` đảm bảo trường `name` trong `items` không bao giờ null/whitespace (`"Hàng hóa"` / `"Hàng hóa hoàn trả"`).
    3. **Ngăn chặn Saga Conflict**: Nếu tạo vận đơn hoàn hàng thất bại, không bắn `SubOrderRejectedEvent` (vốn chỉ dành cho luồng tạo đơn ban đầu làm huỷ SubOrder), mà chỉ ghi log, đánh dấu `Shipment.Status = Failed` và `FailureReason`.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` -> 0 errors across all 8 microservices.

- [x] Tinh Gọn Scope RefundStatus (Pending, SellerApproved, SellerRejected, Cancelled), Xóa Bỏ AttemptCount (EF Migration), Khắc Phục Lệch Trạng Thái Hoàn Tiền, Nâng Cấp RefundRequestsTab Khách Hàng & Chuẩn Hóa Tiếng Việt Bảng Seller:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Giảm Scope `RefundStatus.cs` & Xóa Bỏ `AttemptCount`**:
       - Giảm phạm vi `RefundStatus` xuống còn 4 trạng thái cốt lõi xoay quanh Seller và Buyer: `Pending` (1 - Chờ duyệt), `SellerApproved` (2 - Đã chấp thuận), `SellerRejected` (3 - Đã từ chối), `Cancelled` (4 - Đã hủy). Loại bỏ hoàn toàn các trạng thái admin/dispute rườm rà.
       - Xóa bỏ trường `AttemptCount` và logic `Resubmit` nhiều lần trong [RefundRequest.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Orders/Ecommerce.Services.Orders.Domain/RefundRequest.cs) và [RefundRequestDto.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Orders/Ecommerce.Services.Orders.Application/Features/Orders/Dtos/RefundRequestDto.cs).
       - Tạo và áp dụng thành công EF Core Migration `Remove_AttemptCount_From_RefundRequest` trên database PostgreSQL `OrdersDb`.
    2. **Khắc Phục Lệch Trạng Thái Hoàn Tiền (SellerApproved Bị Hiển Thị Nhầm Thành Từ Chối)**:
       - Sửa lỗi trong [VoucherHelpers.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/order/components/VoucherHelpers.tsx) và [ProfileOrderTabs.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/order/components/ProfileOrderTabs.tsx): `SellerApproved` và `Approved` đều được map chính xác thành *"Đã duyệt hoàn tiền"* / *"Đã chấp thuận"* (xanh ngọc emerald), không còn bị rơi vào nhánh `else` hiển thị *"Shop từ chối"*.
    3. **Tách Riêng & Nâng Cấp `RefundRequestsTab` Dành Cho Khách Hàng ([RefundRequestsTab.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/order/components/refund/RefundRequestsTab.tsx))**:
       - Tách hoàn toàn `RefundRequestsTab` ra khỏi `ProfileOrderTabs.tsx` thành file độc lập đặt tại `src/domains/order/components/refund/RefundRequestsTab.tsx` theo chuẩn Feature Subcomponents Grouping Rule.
       - Re-export qua `src/domains/order/components/refund/index.ts`, `ProfileOrderTabs.tsx` và `@/domains/order`.
       - Bổ sung 2 nút hành động:
         - **Chi tiết đơn**: Chuyển ngay sang xem chi tiết đơn hàng qua [CustomerOrderDetailView.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/order/components/CustomerOrderDetailView.tsx) (`isSeller={false}`).
         - **Chi tiết hoàn**: Mở Modal chi tiết hoàn tiền (portaled `z-10000`) hiển thị đầy đủ lý do, mô tả, phòng trưng bày bằng chứng (ảnh phóng to Lightbox, video player phát trực tiếp), phản hồi từ Shop và nút rút yêu cầu nếu còn Pending.
       - Rút gọn lý do/mô tả dài thành 1 dòng với `truncate` kèm tooltip.
       - Thêm thanh lọc trạng thái đơn khiếu nại, mặc định là **"Tất cả trạng thái"** (`All`).
    4. **Chuẩn Hóa Tiếng Việt & Tinh Gọn Bảng Seller ([RefundRequestsView.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/order/components/sellerOrder/RefundRequestsView.tsx))**:
       - Chuyển toàn bộ các tùy chọn trạng thái trong dropdown filter sang tiếng Việt thuần túy: *"Chờ xử lý (Mặc định)"*, *"Tất cả trạng thái"*, *"Đã chấp thuận"*, *"Đã từ chối"*, *"Đã hủy"*.
       - Loại bỏ hoàn toàn khối text *"Tổng cộng: X yêu cầu"*.
       - Bỏ tiền tố *"User "* trong cột khách hàng, chỉ hiển thị mã số `#ID` gọn gàng trên cả bảng và modal chi tiết.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` -> Vite production build succeeded in 1.12s (0 errors).
    - Backend: `dotnet build Microservices.sln` -> 0 errors across all 8 microservices.

- [x] Tách Phân Tích Sàn Thành 2 Chế Độ Riêng Biệt (Phân Tích Sàn & Phân Tích Ngành Hàng), Bảng Thống Kê Hiệu Suất Ngành Hàng Mới (Client-side Category Cache), Top 30 Sản Phẩm Ngành Hàng & Lọc Thời Gian Tùy Chỉnh:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Tách Biệt 4 Chế Độ Phân Tích Admin Độc Lập Tại `AdminAnalyticsFilterBar.tsx`**:
       - Bổ sung chế độ mới `"category"` (`Phân tích ngành hàng`) bên cạnh `"platform"` (`Phân tích sàn`), `"shop"` (`Phân tích một shop`), `"product"` (`Phân tích một sản phẩm`).
       - **Chế độ Sàn (`platform`)**: Chỉ còn hiển thị duy nhất bộ lọc Mốc thời gian (Hôm nay, 3 ngày qua, 7 ngày qua, Tùy chỉnh Tháng/Năm) + Nút "Áp dụng" (vàng/đen). Đã loại bỏ hoàn toàn radio chọn ngành hàng khỏi chế độ sàn.
       - **Chế độ Ngành hàng (`category`)**: Hiển thị bộ lọc Radio Check chọn danh mục cha (vòng tròn viền đen sắc nét, khi chọn tô màu xanh ngọc emerald, triệt tiêu giật layout Zero Layout Shift) + bộ lọc thời gian + Nút "Áp dụng" màu ngọc bích (`bg-emerald-600 hover:bg-emerald-700 text-white`).
       - Nút Áp dụng của tất cả các chế độ tuân thủ cơ chế: vô hiệu hóa và làm xám ("Đã áp dụng" / "Đã phân tích") sau khi bấm, tự động sáng màu và mở khóa khi người dùng thay đổi filter hoặc chuyển tab.
    2. **Component Thống Kê Hiệu Suất Ngành Hàng Mới (`AdminCategoryPerformanceTable.tsx`)**:
       - Đặt tại [src/domains/admin/components/analytics/AdminCategoryPerformanceTable.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/admin/components/analytics/AdminCategoryPerformanceTable.tsx) tuân thủ nghiêm ngặt quy tắc gom nhóm subcomponents ACO.
       - **Tận dụng Cache Cây Danh Mục Catalog (`useCategoriesQuery()`)**: Backend chỉ cần trả về `categoryId`, Frontend tự động tra cứu tên danh mục, icon/ảnh thu nhỏ từ React Query / Redis cache `catalog:categories:tree`, loại bỏ hoàn toàn việc duplicate chuỗi tên từ backend.
       - Hiển thị đầy đủ thông tin: Thứ hạng (#), Ngành hàng (ảnh đại diện, tên, mã định danh `#ID`), Số lượng đã bán (cái), Doanh thu (VND), Tỷ trọng sàn (%) kèm thanh tiến trình trực quan.
       - Nút hành động **"Phân tích"**: Cho phép 1-click drill-down trực tiếp từ bảng tổng quan sàn sang chế độ phân tích chi tiết của ngành hàng đó.
    3. **Giao Diện Chuyên Biệt Cho Phân Tích Ngành Hàng (`AdminOverviewView.tsx`)**:
       - Thẻ tóm tắt thông tin ngành hàng: Hiển thị icon/ảnh đại diện, tên ngành hàng, mã định danh `#ID`, số lượng bán trong kỳ, doanh thu ngành, và tỷ trọng phần trăm đóng góp trên toàn sàn.
       - **Bảng Top 30 Sản Phẩm Bán Chạy Của Ngành Hàng**: Sử dụng `AnalyticsProductPerformanceTable`, gọi API `useAdminTopProductsQuery` với `parentCategoryId`, hiển thị phân trang 2 trang x 15 sản phẩm, đầy đủ ảnh, tên, ID, doanh thu, số lượng bán và liên kết chi tiết sản phẩm.
    4. **Backend Analytics Service Hỗ Trợ Lọc Ngành Hàng Theo Tháng/Năm (`Ecommerce.Services.Analytics.Api`)**:
       - `IAdminAnalyticsService.cs`, `AdminAnalyticsService.cs`, `AdminAnalyticsController.cs`: Bổ sung tham số `year` và `month` cho endpoint `GET /api/analytics/admin/categories?period=...&year=&month=`, hỗ trợ lọc chính xác doanh thu và sản lượng ngành hàng theo từng tháng/năm tùy chỉnh.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` -> Vite production build succeeded in 768ms (0 errors).
    - Backend: `dotnet build src/Services/Analytics/Ecommerce.Services.Analytics.Api` -> Build succeeded (0 errors).

- [x] Sửa Triệt Để Lỗi Kẹt Nút "Đã Phân Tích", Đơn Giản Hóa Reset Filter/Tab Cho Admin & Seller Analytics, Giới Hạn Tab UserProfilePage Cho Admin (Chỉ Show Profile & Thông Báo):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Đơn Giản Hóa Trạng Thái Nút Bấm "Áp Dụng" / "Phân Tích" (Reset Khi Đổi Filter, Reset Khi Đổi Tab)**:
       - Trong [AdminAnalyticsFilterBar.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/admin/components/analytics/AdminAnalyticsFilterBar.tsx) và [AnalyticsFilterBar.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/analytics/AnalyticsFilterBar.tsx):
         - Thay thế toàn bộ logic so sánh `isFilterDirty` phức tạp bằng biến trạng thái `isApplied` tinh gọn.
         - Sử dụng `useRef` (`lastAppliedShopIdRef`, `lastAppliedProductIdRef`) để theo dõi giá trị vừa được áp dụng.
         - **Khi chuyển tab (chế độ thay đổi)**: Lập tức gọi `setIsApplied(false)`, nút sáng màu và bấm được bình thường theo đúng tên hành động của chế độ đó.
         - **Khi thay đổi bất kỳ filter nào** (chọn ngành hàng, đổi mốc thời gian, đổi tháng/năm, nhập/xóa Shop ID, nhập/xóa Product ID, bấm nút X xóa nhanh): Lập tức gọi `setIsApplied(false)`.
         - **Khi được điều hướng sang một Shop ID mới ("qua cái mới rồi")** (ví dụ click nút phân tích từ bảng Cửa hàng `/admin/shops` hoặc URL thay đổi): Nút lập tức reset về `isApplied = false`, hiện "Phân tích shop" màu tím nổi bật, chấm dứt hoàn toàn tình trạng bị kẹt chữ "Đã phân tích" khi chuyển sang shop khác.
         - **Chặn Áp Dụng Khi Input Trống**: Nếu chưa nhập Shop ID hoặc Product ID, nút không bao giờ bị đánh dấu là "Đã phân tích" (luôn giữ nguyên text "Phân tích shop" / "Phân tích sản phẩm").
    2. **Cô Lập Tham Số URL Theo Từng Chế Độ (`AdminOverviewView.tsx`)**:
       - Trong `handleModeChange`: Khi chuyển sang `platform` thì xóa `shopId`, `productId`. Khi chuyển sang `shop` thì xóa `productId`, `cat`. Khi chuyển sang `product` thì xóa `shopId`, `cat`. Đảm bảo các chế độ hoàn toàn độc lập, không bị lem param của nhau.
    3. **Giới Hạn Tab Cho Quản Trị Viên Tại `UserProfilePage.tsx`**:
       - Tích hợp hàm kiểm tra quyền hệ thống `checkIsAdmin()` từ `@/shared/utils/authHelper`.
       - Khi tài khoản đăng nhập là Quản trị viên (`isAdmin === true`), trang hồ sơ người dùng **CHỈ HIỂN THỊ DUY NHẤT 2 TAB**:
         1. **Thông tin tài khoản** (`profile`)
         2. **Thông báo** (`notifications`)
       - Ẩn toàn bộ 4 tab người mua/bán: `Địa chỉ nhận hàng` (`addresses`), `Đơn hàng của tôi` (`orders`), `Quản lý ví` (`wallet`), và `Yêu cầu hoàn tiền` (`refunds`) trên cả thanh điều hướng Sidebar lẫn khu vực hiển thị nội dung Content.
       - Tự động fallback/chuyển hướng về tab `profile` nếu URL hoặc route có tham số tab không thuộc phạm vi cho phép của admin.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` -> Vite build succeeded in 743ms (0 errors).
    - Backend: `dotnet build src/Services/Analytics/Ecommerce.Services.Analytics.Api` -> 0 errors.

- [x] Sửa Lỗi Top Sản Phẩm Admin (L327), Gọi API Lấy Danh Mục Thật, Radio Viền Đen Tô Xanh Zero-Shift, Chuẩn Hóa Top 30 (2 Trang x 15) Cho Admin & Seller, Backend Clamp Chống Phá Hoại & Nút Hành Động Động Theo Chế Độ:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Khắc Phục Lỗi Hiển Thị & Link Sản Phẩm Tại `AdminOverviewView.tsx:L327`**:
       - Chuẩn hóa việc map `items` từ `platformTopProductsData` và `shopProductsData`: chuyển đổi `id: String(p.id || p.productId)` và fallback tên sản phẩm `(p.name && p.name.trim()) || p.productName || $"Sản phẩm #{itemId}"`.
       - Trong [AnalyticsProductPerformanceTable.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/analytics/AnalyticsProductPerformanceTable.tsx): Luôn hiển thị đầy đủ tên sản phẩm, mã định danh `#ID`, ảnh thu nhỏ và đường dẫn hợp lệ `/products/{itemId}`, triệt tiêu hoàn toàn lỗi link `/products/undefined` hoặc tên sản phẩm rỗng.
    2. **Gọi API Danh Mục Thật Từ CSDL/Redis Thay Vì Hardcode**:
       - Kết nối hook `useCategoriesQuery()` từ domain `@/domains/catalog` trong `AdminOverviewView.tsx`.
       - Tự động lọc ra danh sách ngành hàng cha cấp cao nhất (`!c.parentId`), ghép thêm tùy chọn `"Tất cả ngành hàng"` (`id: "all"`) ở vị trí đầu tiên để quản trị viên lọc sản phẩm theo ngành hàng từ dữ liệu thực tế.
    3. **Giao Diện Radio Check Tinh Gọn (Viền Đen, Tô Xanh) & Triệt Tiêu Giật Layout (Zero Layout Shift)**:
       - Nút radio có vòng tròn ngoài viền đen sắc nét (`w-4 h-4 rounded-full border-2 border-slate-900`), khi chọn sẽ tô màu xanh (`bg-blue-600`) cùng chấm trắng nhỏ ở giữa.
       - Cố định font weight `font-semibold text-slate-800` xuyên suốt cả 2 trạng thái (selected và unselected) trên cả radio danh mục và radio mốc thời gian, loại bỏ hoàn toàn hiện tượng nhảy vị trí / giật ngang hàng loạt ký tự khi bấm chọn.
    4. **Chuẩn Hóa Top 30 Sản Phẩm Bán Chạy (Đúng 2 Trang, Mỗi Trang 15 Sản Phẩm) Cho Cả Admin & Seller**:
       - Admin: `useAdminTopProductsQuery` truy vấn theo từng trang `pageSize: 15`, `totalCount: 30`, `totalPages: 2`.
       - Seller: `useSellerTopProductsQuery` truy vấn 30 sản phẩm từ backend (`limit = 30`), sau đó phân trang trực tiếp ở client thành đúng 2 trang x 15 sản phẩm (`pagedProducts = sellerTop30.slice((sellerProductPage - 1) * 15, sellerProductPage * 15)`).
    5. **Chống Phá Hoại Tham Số `pageSize` Phía Backend (Anti-DoS Clamping)**:
       - Trong [AdminAnalyticsController.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Controllers/AdminAnalyticsController.cs) và [AdminAnalyticsService.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Services/AdminAnalyticsService.cs): Kẹp chặt `pageSize = Math.Clamp(pageSize, 1, 30)` cho Top sản phẩm sàn, và tối đa 50 sản phẩm cho `GetShopProducts`.
       - Trong [SellerAnalyticsController.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Controllers/SellerAnalyticsController.cs) và [SellerAnalyticsService.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Services/SellerAnalyticsService.cs): Kẹp chặt `safeLimit = Math.Clamp(limit, 1, 30)`. Ngăn chặn hoàn toàn việc client cố ý truyền `pageSize` âm hoặc số lượng khổng lồ gây nghẽn database.
    6. **Nút Hành Động Hiển Thị Nhãn & Màu Sắc Theo Từng Trạng Thái Chế Độ**:
       - Chế độ Sàn (Toàn sàn & Danh mục): Nút **"Áp dụng"** kèm icon Check, phong cách màu thương hiệu `bg-brand-primary text-brand-dark`.
       - Chế độ Shop: Nút **"Phân tích shop"** kèm icon Store, màu tím nổi bật `bg-purple-600 hover:bg-purple-700 text-white`.
       - Chế độ Sản phẩm: Nút **"Phân tích sản phẩm"** kèm icon Package, màu hổ phách `bg-amber-600 hover:bg-amber-700 text-white`.
    7. **Nút Áp Dụng Vô Hiệu Hóa & Làm Xám Sau Khi Bấm, Tự Động Hiện Lại Khi Thay Đổi Filter**:
       - Bổ sung `isFilterDirty`, `isLocallyApplied`, `isButtonDisabled` cho cả [AdminAnalyticsFilterBar.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/admin/components/analytics/AdminAnalyticsFilterBar.tsx) và [AnalyticsFilterBar.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/analytics/AnalyticsFilterBar.tsx).
       - Khi bấm nút, nút lập tức chuyển sang trạng thái disabled (`cursor-not-allowed`), nền xám `bg-slate-200/80 text-slate-400 border-slate-300` và hiển thị "Đã áp dụng" / "Đã phân tích" với icon check mờ.
       - Khi người dùng thay đổi bất kỳ filter nào (ngành hàng, mốc thời gian, tháng/năm, mã shop, mã sản phẩm), nút lập tức trở lại màu sắc rực rỡ theo mode và bấm được lại bình thường.
    8. **Khắc Phục Triệt Để Lỗi Trùng Đè Chữ Trục X Trên Biểu Đồ (Spline Revenue Chart & Order Chart)**:
       - Trong [AnalyticsRevenueChart.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/analytics/AnalyticsRevenueChart.tsx): Xây dựng hàm `shouldShowXAxisLabel(index, total)` tính toán bước nhảy thông minh (khoảng 6-7 nhãn cho 30-31 ngày, luôn hiển thị mốc đầu ngày 01 và mốc cuối ngày 30/31).
       - Bổ sung vạch chia tick mark nối giữa trục X và nhãn ngày.
       - Khi rê chuột vào bất kỳ ngày nào trên đường cong, tooltip vẫn hiển thị đầy đủ ngày cụ thể, số tiền và số đơn hàng.
       - Đồng bộ hiển thị mốc ngày cách đều trên cả [AnalyticsOrderChart.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/analytics/AnalyticsOrderChart.tsx).
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build src/Services/Analytics/Ecommerce.Services.Analytics.Api` -> 0 errors.
    - Frontend: `npm run build` -> Vite build succeeded in 849ms (0 errors).
    - Frontend Lint: `npm run lint` -> 0 errors.

- [x] Triển Khai & Tinh Gọn Phân Tích Danh Mục (Chỉ Lưu ParentCategoryId, Xóa CategoryName/ParentCategoryName/SubCategory, FE Tự Map Tên Từ Cache Cây Danh Mục), Tách Riêng Phí Ship GHN, Đếm Số Đơn Hủy/Hoàn Trả Thật, Bộ Lọc Admin 2 Tầng Kèm Pills Nằm Ngang, Bảng Hiệu Suất Sản Phẩm Full-Width Không Cột Số Đơn & Deep-Linking:
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Kiến Trúc Tinh Gọn Phân Tích Danh Mục (Chỉ Lưu Duy Nhất `ParentCategoryId`, Không Duplicate Tên Chuỗi)**:
       - Loại bỏ hoàn toàn các trường thừa `CategoryId` (sub-category), `CategoryName`, `ParentCategoryName`, `SubCategoryId`, `SubCategoryName` khỏi [ShopProductStats.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Models/Entities/ShopProductStats.cs) và [DailyCategoryRevenue.cs](file:///home/vanmuzic/Projects/Ecommerce_Microservices/src/Services/Analytics/Ecommerce.Services.Analytics.Api/Models/Entities/DailyCategoryRevenue.cs).
       - Chỉ lưu duy nhất mã định danh ngành hàng cha `ParentCategoryId` (long).
       - Không lưu tên danh mục trong Analytics DB vì tên có thể bị sửa đổi trong Catalog. Frontend đã có sẵn cây danh mục trong cache (React Query `useCategoriesQuery()` từ Redis cache `catalog:categories:tree`), tự động ánh xạ `parentCategoryId` -> `categoryName` tức thì (< 0.1ms) và luôn phản ánh dữ liệu mới nhất.
       - Tạo và áp dụng thành công EF Core Migration `Simplify_Category_Analytics_To_Parent_Only` trên database PostgreSQL `AnalyticsDb`.
    2. **Tách Biệt Phí Vận Chuyển Bên Thứ Ba (GHN) Trong Kế Toán Sàn**:
       - `DailyPlatformRevenue`: Bổ sung trường `TotalShippingFee`.
       - `SubOrderCompletedAnalyticsConsumer`: Tích lũy phí ship thu hộ vào `TotalShippingFee`, tách biệt hoàn toàn dòng tiền thu hộ trả cho đơn vị vận chuyển GHN khỏi Doanh thu thuần của Sàn (`NetPlatformRevenue`) và GMV.
    3. **Theo Dõi Trạng Thái Đơn Hàng Thực Tế (Hoàn Thành, Đã Hủy, Hoàn Trả)**:
       - `DailyShopRevenue`: Bổ sung `CompletedOrderCount`, `CancelledOrderCount`, `RefundedOrderCount`, và `RefundAmount`.
       - `SubOrderCancelledAnalyticsConsumer` [NEW]: Lắng nghe `SubOrderRejectedEvent` (bổ sung `ShopId`), tăng đếm `CancelledOrderCount`.
       - `RefundApprovedAnalyticsConsumer` [NEW]: Lắng nghe `RefundApprovedEvent` (bổ sung `ShopId`), tăng đếm `RefundedOrderCount` và cộng dồn `RefundAmount`.
       - `AnalyticsOrderChart.tsx`: Hiển thị số liệu thực tế từ backend, loại bỏ hoàn toàn các giá trị 0 hardcode.
    4. **Bộ Lọc Admin 2 Tầng (`AdminAnalyticsFilterBar.tsx`)**:
       - **Tầng 1**: 3 Mode Switchers (`Phân tích sàn` [Mặc định], `Phân tích một shop`, `Phân tích một sản phẩm`) + Bộ chọn thời gian (Hôm nay, 3 ngày qua, 7 ngày qua, Tự chỉnh Tháng/Năm).
       - **Tầng 2 (Sub-filter động)**:
         - Mode Sàn: Danh mục cha dạng **Horizontal Radio Pills** (dàn đều ngang bằng `flex-wrap`, tiết kiệm không gian chiều dọc).
         - Mode Shop: Ô nhập chính xác Shop ID (không autocomplete) + nút "Phân tích".
         - Mode Sản phẩm: Ô nhập URL hoặc Product ID (tự động trích xuất ID từ URL chi tiết sản phẩm, không autocomplete) + nút "Phân tích".
    5. **Tái Cấu Trúc Toàn Diện Giao Diện Quản Trị Viên (`AdminOverviewView.tsx`)**:
       - 4 thẻ KPI đồng bộ: `Tổng GMV`, `Doanh Thu Sàn`, `Phí Vận Chuyển Đơn Vị GHN`, `Tổng Đơn Hàng`.
       - **Chế độ Toàn Sàn**: Biểu đồ Spline doanh thu sàn, Biểu đồ trạng thái đơn hàng, và Bảng xếp hạng Top 30 sản phẩm bán chạy nhất toàn sàn phân trang (2 trang x 15 sản phẩm).
       - **Chế độ Shop**: Thẻ KPI shop, biểu đồ doanh thu shop, biểu đồ trạng thái đơn hàng, và bảng toàn bộ sản phẩm của shop có phân trang.
       - **Chế độ Sản phẩm**: Giao diện `AdminProductDeepDiveView.tsx` hiển thị thẻ sản phẩm (ảnh, tên, ID, giá, tồn kho, nhãn danh mục ánh xạ từ cache), các chỉ số KPI chuyên biệt và biểu đồ xu hướng doanh thu hàng ngày.
    6. **Deep-Linking Từ Các Trang Quản Trị Vào Analytics**:
       - `AdminShopsView.tsx`: Nút "Phân tích" điều hướng trực tiếp sang `/admin/overview?mode=shop&shopId=${s.id}`.
       - `AdminProductsView.tsx`: Nút "Phân tích" điều hướng trực tiếp sang `/admin/overview?mode=product&productId=${p.id}`.
    7. **Bảng Hiệu Suất Sản Phẩm Mới (`AnalyticsProductPerformanceTable.tsx`)**:
       - Thiết kế toàn chiều rộng (full-width), có ảnh thu nhỏ, tên sản phẩm, mã ID, huy hiệu ngành hàng cha ánh xạ từ cache, doanh thu, số lượng đã bán, và phân trang.
       - **Tuyệt đối không có cột số đơn hàng** theo đúng yêu cầu.
       - Áp dụng đồng bộ cho cả `ShopAnalyticsDashboard.tsx` và `AdminOverviewView.tsx`.
     8. **Khắc Phục Lỗi Axios TypeError: target must be an object & activeTopProducts.slice is not a function**:
        - **Lỗi 1 (Axios target must be an object)**: Trong [adminAnalyticsApi.ts](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/admin/api/adminAnalyticsApi.ts), khi gọi API `/analytics/admin/top-products`, hàm nhận `params` có thể là số `25`. Axios yêu cầu `params` phải là một plain object. Đã chuẩn hóa: nếu là số thì chuyển thành `{ limit: params }`, đồng thời lọc bỏ `parentCategoryId === "all"` để không gây lỗi parse kiểu `long?` trên backend.
        - **Lỗi 2 (activeTopProducts.slice is not a function)**: Backend endpoint trả về đối tượng phân trang `PaginatedProductsData { items: [...], totalCount: ... }` chứ không phải mảng trực tiếp. Trong [ShopAnalyticsDashboard.tsx](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/seller/components/ShopAnalyticsDashboard.tsx), `activeTopProducts` lấy từ `adminTopProductsData` bị gán là một object, dẫn đến `.slice()` và `.reduce()` bị crash. Đã bọc chuẩn hóa `activeTopProducts` luôn trích xuất an toàn `(adminTopProductsData?.items || [])` và thêm `Array.isArray` guard.
        - Ẩn bảng hiệu suất sản phẩm trùng lặp trong `ShopAnalyticsDashboard.tsx` khi `isAdminView === true` (vì `AdminOverviewView.tsx` đã tự quản lý bảng phân trang riêng).
     9. **Chuẩn Hóa Thư Mục Subcomponents Admin (`components/analytics/`), Filter Radio Hình Tròn & Nút Áp Dụng Căn Phải Cùng**:
        - **Nguyên tắc kiến trúc mới (Rule F trong AGENTS.md & 04_frontend_standards.md)**: Gom toàn bộ subcomponents của tính năng phân tích hệ thống vào thư mục riêng biệt [frontend-web/src/domains/admin/components/analytics/](file:///home/vanmuzic/Projects/Ecommerce_Microservices/frontend-web/src/domains/admin/components/analytics/) gồm `AdminAnalyticsFilterBar.tsx`, `AdminProductDeepDiveView.tsx`, và barrel export `index.ts`, chấm dứt việc đặt flat tràn lan tại thư mục `components/`.
        - **Bộ Lọc Ngành Hàng (Radio Hình Tròn + Text)**: Thay thế hoàn toàn các ô hình chữ nhật màu xanh bằng nút radio hình tròn tinh gọn kèm chữ tên danh mục (`adminParentCategoryRadio`), dàn đều hàng ngang flex-wrap.
        - **Hiển Thị Trực Tiếp Mốc Thời Gian**: Show thẳng các mốc `Hôm nay`, `3 ngày qua`, `7 ngày qua`, `Tự chỉnh` (chọn tháng/năm trực tiếp ngay cạnh dòng mốc thời gian, không ẩn giấu).
        - **Nút "Áp Dụng" Chung Căn Phải Cùng**: Nằm ở góc phải dưới cùng hàng thời gian, cho phép chọn Category và Thời gian rồi nhấn "Áp dụng" một lần để cập nhật đồng bộ toàn bộ dữ liệu sàn. Các nút hành động ở chế độ Shop ("Xem phân tích shop") và Sản phẩm ("Soi phân tích") đều được căn phải cùng chuẩn xác.
        - **Khử Duplicate Filter Bar**: `ShopAnalyticsDashboard.tsx` hỗ trợ `hideFilterBar={true}` và nhận `controlledPreset`, `controlledMonth`, `controlledYear` từ Admin Overview, loại bỏ hoàn toàn thanh filter thừa khi nhúng vào Admin.
  - **Kiểm Thử & Biên Dịch**:
    - Backend Build: `dotnet build Microservices.sln` -> Build succeeded (0 errors).
    - Database Migration: `Simplify_Category_Analytics_To_Parent_Only` -> Đã cập nhật trên PostgreSQL `AnalyticsDb`.
    - Frontend Build: `npm run build` -> Vite build succeeded in 714ms (0 errors).
    - Frontend Lint: `npm run lint` -> 0 errors.

- [x] Khắc Phục Lệch Dữ Liệu Analytics (Đồng Bộ Số Đơn & Sản Phẩm Đã Bán Giữa FE & BE, Sửa Bug orderCount Luôn = 1 Khi Chọn Sản Phẩm Chưa Có Lượt Bán, Đồng Bộ Typography Title & Description Theo Chuẩn text-4 / text-[12px], Xóa Khối Kênh Thanh Toán Hỗ Trợ):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Đồng Nhất Số Liệu Bán Hàng Giữa FE & BE (`ShopAnalyticsDashboard.tsx`)**:
       - Khắc phục lỗi `totalOrders === 0` nhưng `totalSoldUnits` vẫn hiển thị 5 cái (do trước đó lấy tổng tích lũy all-time từ `ShopProductStats`): Khi kỳ lọc hiện tại không phát sinh đơn hàng (`totalOrders === 0`), `totalSoldUnits` trả về 0 cái kèm phụ đề "Chưa có lượt bán" chuẩn xác và đồng nhất.
       - Khi sản phẩm được chọn chưa có lượt bán (`soldQuantity === 0`), toàn bộ điểm trên biểu đồ `chartData` trả về 0, không hiển thị dữ liệu của các sản phẩm khác.
    2. **Sửa Lỗi `orderCount = 1` Khi Chọn Sản Phẩm Từ CSDL Chưa Có Dữ Liệu**:
       - Trong `totalOrders` và `productPerformanceList`: Bỏ logic ép `Math.max(1, ...)`. Khi `soldQuantity === 0`, `orders` trả về chính xác 0 đơn hàng (thay vì 1 đơn).
       - Trong `AnalyticsProductPerformance.tsx`: Cập nhật `barPercent = 0` khi `currValue === 0` để thanh tiến độ không chiếm độ rộng giả 8%.
    3. **Đồng Bộ Hóa Kích Thước Title & Description**:
       - Chuẩn hóa header của `ShopAnalyticsDashboard.tsx` theo Design System chung của dự án: Title chuyển thành `text-4 font-black text-brand-dark uppercase tracking-wider`, Description chuyển thành `text-[12px] text-brand-muted font-bold mt-0.5`.
    4. **Xóa Bỏ Hoàn Toàn Khối Kênh Thanh Toán Hỗ Trợ**:
       - Xóa component `AnalyticsPaymentChannels` khỏi giao diện dashboard và dọn dẹp export tại barrel `src/domains/seller/components/analytics/index.ts`.
       - Khắc phục lỗi TDZ `ReferenceError: can't access lexical declaration 'selectedProductStat' before initialization`: Đưa toàn bộ khai báo `top10Products`, `availableFilterProducts`, `selectedProductStat`, và `handleAddCustomProduct` lên trước `chartData`.
       - Khắc phục lỗi không đổ được dữ liệu biểu đồ/KPI (`activeChartRaw.points`): Do API backend trả về trực tiếp mảng `RevenueChartPoint[]`, biểu thức kiểm tra trước đó `activeChartRaw?.points` luôn trả về `undefined` khiến `chartData` luôn rỗng (`[]`). Đã sửa cơ chế bóc tách hỗ trợ cả dạng mảng trực tiếp lẫn object chứa `.points`, định dạng nhãn ngày `DD/MM` ngắn gọn và tính toán chuẩn xác `totalSoldUnits`.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend Build: `npm run build` -> Vite build succeeded in 773ms (0 errors).
    - Frontend Lint: `npm run lint` -> 0 errors.

- [x] Phân Quyền & Khóa Các Trang Riêng Biệt Khỏi Tài Khoản Quản Trị Viên (Admin) (RequireNonAdmin Guard Cho Seller & Customer Routes, Ẩn Cart/Wishlist/Orders Dropdown Trong Header):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Tạo Mới Route Guard `RequireNonAdmin.tsx`**:
       - Ngăn chặn tài khoản Admin truy cập các trang đặc thù của Khách hàng hoặc Người bán khi gõ trực tiếp URL.
       - Tự động hiển thị Toast thông báo và chuyển hướng (redirect) an toàn về Trang Quản Trị `/admin` (hoặc `/admin/orders`).
    2. **Cấu Hình Phân Tuyến Tuyệt Đối Tại `AppRoutes.tsx`**:
       - **Kênh Người Bán (`/seller`, `/seller/register`, `/seller/dashboard/*`, `/seller/:shopId/dashboard/*`)**: Bọc qua `RequireNonAdmin`. Admin bị chặn và chuyển hướng về `/admin` với thông báo `"Tài khoản Quản trị viên không thể truy cập Kênh người bán. Vui lòng quản lý tại Trang Quản trị."`.
       - **Trang Mua Sắm Khách Hàng (`/cart`, `/checkout`, `/wishlist`)**: Bọc qua `RequireNonAdmin`. Admin bị chặn và chuyển hướng về `/admin` với thông báo `"Tài khoản Quản trị viên không sử dụng tính năng giỏ hàng & sản phẩm yêu thích."`.
       - **Đơn Hàng Cá Nhân (`/orders`, `/orders/:subOrderId`)**: Bọc qua `RequireNonAdmin` với `redirectTo="/admin/orders"`. Admin truy cập sẽ tự động chuyển sang trang Quản trị đơn hàng toàn sàn.
    3. **Tối Ưu Menu Người Dùng Trong `Header.tsx`**:
       - Khi `isSystemAdmin = true`: Menu dropdown khi click Avatar hiển thị chuyên biệt cho Admin:
         - Nổi bật nút `Trang Quản trị (Admin)` (`/admin` với icon `ShieldCheck`).
         - Nút `Thông tin tài khoản` (`/profile` với icon `Settings`).
         - Ẩn hoàn toàn 2 mục không phù hợp `Đơn hàng của tôi` và `Sản phẩm yêu thích`.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend Build: `npm run build` -> Vite build succeeded in 720ms (0 errors).
    - Frontend Lint: `npm run lint` -> 0 errors.

- [x] Khắc Phục Triệt Để Lỗi Tự Động Đăng Xuất Khi Hết Hạn AccessToken Trên Frontend (Bỏ ClearState Trong Route Guards, Tách authClient & tokenRefresh Singleton Tránh Circular Dependency, Cấu Hình Interceptor 401 & Proactive Refresh Timer):
  - **Mục tiêu & Kết quả hoàn thành**:
    1. **Khắc Phục Lỗi Tự Động Đăng Xuất Do Route Guards (`RequireAuth.tsx`, `RequireAdmin.tsx`, `authHelper.ts`)**:
       - Xóa bỏ logic `if (!isAuthenticated(token)) clearState()` trong các route guards.
       - Sửa `RequireAuth` và `RequireAdmin` chỉ chuyển hướng sang Login khi người dùng thực sự không có `accessToken` (`!accessToken`).
       - Sửa `checkIsAdmin(token)` kiểm tra trực tiếp payload role mà không phụ thuộc vào việc token hết hạn theo đồng hồ client, ngăn chặn việc admin bị văng về trang chủ khi token đang chờ refresh.
    2. **Xóa Bỏ Circular Dependency & Tách Module Độc Lập (`tokenRefresh.ts`)**:
       - Tạo `src/core/api/tokenRefresh.ts` với `authClient` độc lập (`withCredentials: true`, timeout 10s, không gắn Bearer Token Interceptor để tránh gửi kèm token hết hạn lên server).
       - Cung cấp hàm `refreshAccessToken()` với cơ chế Singleton Promise (Mutex lock), ngăn chặn race condition khi nhiều request đồng thời gặp 401 và bảo vệ quy tắc Token Rotation (`TokenUsage.OneTimeOnly`) của IdentityServer.
       - Chỉ gọi `clearState()` đăng xuất an toàn khi server thực sự từ chối Refresh Token (401 hoặc 400).
    3. **Chuẩn Hóa Axios Interceptor 401 (`axiosInstance.ts`) & Auth Service (`authApi.ts`)**:
       - Bắt mã lỗi 401, tạm giữ request, gọi `refreshAccessToken()`, gán `Authorization: Bearer <newAccessToken>` vào request cũ và retry tự động.
       - `authService.refresh()` và `authService.logout()` ủy quyền trực tiếp qua `refreshAccessToken()` và `authClient`.
    4. **Bổ Sung Proactive Silent Refresh Timer & Tab Focus Sync (`AuthProvider.tsx`)**:
       - Hẹn giờ tự động làm mới `accessToken` trước khi hết hạn 5 phút (ở phút thứ 55).
       - Lắng nghe `visibilitychange` và `window.focus` để chủ động làm mới token ngay khi người dùng mở lại tab/máy tính nếu token còn dưới 2 phút hoặc đã hết hạn.
    5. **Tối Ưu `useCurrentUserQuery` (`useAuth.ts`) & `LoginPage.tsx`**:
       - Đặt `enabled: Boolean(accessToken)` để query không bị tắt đột ngột khi token vừa chạm mốc hết hạn.
       - `LoginPage.tsx`: Thử `refreshAccessToken()` trước khi xóa session nếu người dùng mở trang login khi session cookie vẫn còn hạn.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend Build: `npm run build` -> Vite build succeeded in 714ms (0 errors).
    - Frontend Lint: `npm run lint` -> 0 errors.

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

