- [x] Thiết Kế & Triển Khai Kiến Trúc Cấu Hình Ghi Đè Developer (Cascading Developer AppSettings Architecture) Cho Toàn Bộ Microservices:
  - **Vấn đề cốt lõi**: Đưa trực tiếp API keys (Momo Sandbox, VNPay HashSecret, GHN API Token, Gmail App Password) vào `appsettings.json` rồi commit lên Git dẫn đến rủi ro bảo mật nghiêm trọng (bị lộ secret, cảnh báo secret scanning của GitHub). Đồng thời việc tạo quá nhiều file `.example` gây rác dự án khi `appsettings.json` đã được viết mẫu sẵn placeholder.
  - **Giải pháp tinh gọn & chuẩn xác**:
    1. **Tầng 1 - `appsettings.json` (Base & Example / Commit lên Git)**: Đóng vai trò vừa là khung sườn ứng dụng (Kestrel ports, Serilog log levels, Yarp ReverseProxy routes, CORS, AllowedHosts, DB default local), vừa là file mẫu chứa đầy đủ placeholder trực quan (`YOUR_MOMO_SECRET_KEY`, `YOUR_GHN_API_TOKEN`, `YOUR_GMAIL_APP_PASSWORD`). Bỏ hoàn toàn các file `*.example` thừa.
    2. **Tầng 2 - `appsettings.Developer.json` (File ghi đè cục bộ / Nằm trong `.gitignore`)**: Chứa thông tin secret thực tế của developer chạy local. Developer chỉ cần ghi đúng các key muốn ghi đè.
    3. **Cơ chế nạp tự động qua `BuildingBlocks.Logging` (`CustomLoggingExtensions.cs`)**:
       - Bổ sung `builder.AddCustomConfiguration()` gọi `builder.Configuration.AddJsonFile("appsettings.Developer.json", optional: true, reloadOnChange: true).AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)`.
       - Tích hợp trực tiếp vào `AddCustomSerilog` $\rightarrow$ Toàn bộ 9 service tự động có tính năng nạp ghi đè `appsettings.Developer.json` với Deep Merge mà không cần sửa bất kỳ file `Program.cs` nào.
    4. **Môi trường Production / CI-CD**: Sử dụng biến môi trường (Environment Variables) theo chuẩn 12-Factor App (`ConnectionStrings__Database`, `Momo__SecretKey`...) ghi đè lên các tầng file.
  - **Kiểm thử**: Đã xóa sạch toàn bộ các file `appsettings.Local.example.json`, đổi tên các file secret sang `appsettings.Developer.json`, cập nhật `.gitignore` (`*.Developer.json`), và biên dịch thành công `BuildingBlocks.Logging` (0 errors).
- [x] Khắc Phục Triệt Để Lỗi Dịch Chuyển Giao Diện (Layout Shift 0px) & Giật Lắc Khi Bấm Chuyển Tabs Đơn Hàng (`ProfileOrderTabs.tsx`, `index.css`):
  - **Nguyên nhân gốc rễ**:
    1. **Hiện tượng giật layout do thanh cuộn dọc biến mất (Scrollbar Toggling / CLS)**: Khi chuyển giữa tab có danh sách đơn dài (chiều cao trang > 100vh $\rightarrow$ xuất hiện thanh cuộn dọc chiếm 15-17px) và tab rỗng (chiều cao trang $\le$ 100vh $\rightarrow$ thanh cuộn dọc biến mất), container `max-w-6xl mx-auto` căn giữa bị dịch chuyển sang phải ~8px rồi bật giật lại khi danh sách đơn xuất hiện lại.
    2. **Hiện tượng giật cục bộ trong thanh tab do đổi font weight (`font-bold` $\leftrightarrow$ `font-extrabold`)**: Khi tab được chọn (`isActive`), class đổi từ `font-bold` (700) sang `font-extrabold` (800) làm độ rộng của chữ trong tab giãn nở 3-5px. Kết hợp với `transition-all` làm các tab lân cận bị đẩy sang phải trong 150ms rồi giật lại.
  - **Giải pháp toàn diện**:
    1. **Khóa thanh cuộn bằng `scrollbar-gutter: stable` (`index.css`)**: Thêm `scrollbar-gutter: stable;` cho thẻ `html` (kèm fallback `@supports not (scrollbar-gutter: stable) { html { overflow-y: scroll; } }`). Đảm bảo không gian thanh cuộn luôn được dự trữ cố định, triệt tiêu 100% hiện tượng dịch chuyển ngang toàn trang của `mx-auto`.
    2. **Cố định kích thước & Chuẩn hóa hiệu ứng Tab (`ProfileOrderTabs.tsx`)**:
       - Giữ nguyên `font-bold` đồng nhất cho cả 2 trạng thái Active và Inactive, xóa bỏ hoàn toàn việc chuyển sang `font-extrabold` gây co giãn nút.
       - Thay thế `transition-all` bằng `transition-colors` (chỉ chuyển màu chữ, viền và nền, giữ nguyên 100% hình học kích thước).
       - Khôi phục pill badge đếm số lượng đơn hàng với `font-bold` và `transition-colors` ổn định.
       - Bổ sung class `.no-scrollbar` ẩn thanh cuộn ngang thô trên tab bar.
  - **Kiểm Thử Thực Tế**:
    - Sử dụng browser test đo đạc tọa độ X trước và sau khi click qua lại giữa cả 9 tabs: Header (57px), Sidebar (200px), Nút Làm mới (834px), Ô tìm kiếm (571px), các tab 1..9 đều giữ nguyên pixel cố định $\rightarrow$ **0px Layout Shift**!
    - Frontend build: `npm run build` $\rightarrow$ ✅ Succeeded in 1.00s, 0 errors.
- [x] Khắc Phục Triệt Để Lỗi "Maximum update depth exceeded" / Throttling Navigation Do Vòng Lặp Điều Hướng Vô Tận Giữa LoginPage và Route Guards Khi JWT Hết Hạn (`useAuthStore.ts`, `LoginPage.tsx`, `RequireAuth.tsx`, `RequireAdmin.tsx`, `useAuth.ts`):
  - **Nguyên nhân gốc rễ của lỗi React Loop**:
    1. Khi JWT Access Token trong `localStorage` hết hạn, các component bảo vệ route (`RequireAuth`, `RequireAdmin`) sử dụng hàm `isAuthenticated(token)` để kiểm tra thời hạn (`Date.now() >= exp * 1000`). Nhận thấy token đã hết hạn, Guard kích hoạt chuyển hướng người dùng về `/login?redirect=...`.
    2. Tại `LoginPage.tsx`, `useEffect` trước đây chỉ kiểm tra điều kiện `if (accessToken)` (vẫn còn lưu chuỗi token cũ trong Zustand/localStorage) mà KHÔNG kiểm tra tính hợp lệ qua `isAuthenticated(accessToken)`. Do đó, `LoginPage` ngộ nhận người dùng đã đăng nhập và lập tức gọi `navigate(redirectParam, { replace: true })` ngược lại trang vừa bị chặn.
    3. Trang được bảo vệ lại lập tức phát hiện token hết hạn và đẩy về `/login`, tạo ra hiện tượng bóng bàn điều hướng vô tận (ping-pong redirect loop) hàng trăm lần trong một giây dẫn tới trình duyệt cảnh báo `Throttling navigation to prevent the browser from hanging` và React ném ngoại lệ `Maximum update depth exceeded`.
  - **Cơ Chế Bảo Vệ Đa Tầng Triệt Để**:
    1. **Khởi tạo Auth Store An Toàn (`useAuthStore.ts`)**:
       - Bổ sung hàm kiểm tra `getInitialAccessToken()`: Kiểm tra `isAuthenticated(token)` ngay thời điểm khởi tạo Zustand Store. Nếu token rỗng hoặc đã hết hạn, tự động xóa sạch `accessToken`, `refreshToken`, `user` khỏi `localStorage` và khởi tạo `accessToken: null`.
    2. **Xử Lý Ngắt Vòng Lặp Tại `LoginPage.tsx`**:
       - Trong `useEffect`: Bắt buộc kiểm tra `if (accessToken && isAuthenticated(accessToken))`. Nếu có token nhưng đã hết hạn, chủ động gọi `clearState()` và hủy bỏ hoàn toàn việc điều hướng, giữ người dùng ở lại giao diện đăng nhập bình thường.
       - Chuẩn hóa URL chuyển hướng `safeDestination`: Chặn tự chuyển hướng ngược về các trang xác thực (`/login`, `/register`, `/forgot-password`, `/reset-password`).
       - Phân quyền Admin: Nếu URL chuyển tiếp (`redirectParam`) thuộc `/admin` nhưng người dùng không có vai trò Admin, tự động chuyển hướng về trang chủ `/` thay vì đưa vào `/admin` (chống vòng lặp với `RequireAdmin`).
       - Cập nhật luồng đăng nhập thành công (`onSubmit`) sử dụng chung logic phân giải điểm đến an toàn.
    3. **Dọn Sạch State Tại Route Guards (`RequireAuth.tsx`, `RequireAdmin.tsx`)**:
       - Trước khi chuyển hướng về `/login`, Guard kiểm tra nếu `accessToken` tồn tại trong state nhưng không còn hợp lệ (`!isAuthenticated(accessToken)`), lập tức gọi `useAuthStore.getState().clearState()` để dọn sạch state rác trước khi đổi trang.
    4. **Ngăn Ngừa Request 401 Không Cần Thiết (`useAuth.ts`)**:
       - Thiết lập điều kiện `enabled: authed` cho React Query, trong đó `authed = Boolean(accessToken) && isAuthenticated(accessToken)`. Ngăn chặn việc gửi request `GET /api/users/me` với token chết lên backend.
       - Chuẩn hóa import `import { api } from "@/core";`.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Succeeded in 760ms, 4,272 modules transformed, 0 Error.
- [x] Tách Biệt Rõ Ràng Trạng Thái Đã Giao (Delivered) & Hoàn Thành (Completed), Sửa Lệch Badge Đơn Hàng, Thêm Đầy Đủ 9 Tabs ProfileOrderTabs Kèm Đếm Số Lượng & Hiển Thị Chuẩn Trạng Thái Vận Đơn:
  - **Khắc Phục Nhầm Lẫn Giữa Trạng Thái Đã Giao & Đã Hoàn Thành (`VoucherHelpers.tsx`)**:
    - **Nguyên nhân**: Trước đây `case "Delivered"` bị gộp chung với `case "Completed"` trả về text *"Đã hoàn thành"*, khiến cho các đơn hàng vừa giao xong (`Delivered`) hiển thị sai thành đã hoàn tất hóa đơn (`Completed`).
    - **Giải pháp**: Tách bạch 2 trạng thái rõ ràng:
      - `Delivered` $\rightarrow$ Badge màu Teal/Xanh mòng két: *"Đã giao hàng"*.
      - `Completed` $\rightarrow$ Badge màu Emerald: *"Đã hoàn thành"*.
      - `Returning` $\rightarrow$ Badge màu Orange: *"Đang trả hàng"*.
      - `Refunded` $\rightarrow$ Badge màu Rose: *"Đã hoàn tiền"*.
  - **Sửa Triệt Để Lỗi Lệch / Vênh Badge Đơn Hàng (`VoucherHelpers.tsx`, `ProfileOrderTabs.tsx`, `CustomerOrderDetailView.tsx`, `OrdersView.tsx`)**:
    - **Nguyên nhân**: Lớp CSS cũ dùng `inline-block py-0.8 text-[10px]` (lỗi class Tailwind `py-0.8` không tồn tại dẫn đến padding dọc bằng 0, chữ bị lệch baseline) và thẻ cha thiếu `shrink-0`/`items-center`.
    - **Giải pháp**: Chuẩn hóa toàn bộ badge sang `inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold rounded-md leading-none shadow-2xs whitespace-nowrap`, căn giữa hoàn hảo theo cả chiều dọc và ngang, bổ sung `shrink-0 flex items-center ml-2` trên container thẻ đơn hàng.
  - **Mở Rộng Đầy Đủ 9 Tabs Đơn Hàng & Thêm Badge Đếm Số Lượng (`ProfileOrderTabs.tsx`)**:
    - Bổ sung 3 tab còn thiếu: **"Hoàn thành"** (`Completed`), **"Đang trả hàng"** (`Returning`), và **"Trả hàng"** (`Refunded`), nâng tổng số lên 9 tabs chuẩn quy trình thương mại điện tử:
      `Tất cả đơn`, `Chờ thanh toán`, `Đang xử lý`, `Vận chuyển`, `Đã giao`, `Hoàn thành`, `Đang trả hàng`, `Trả hàng`, `Đã hủy`.
    - Tinh chỉnh kích thước (`py-2.5 px-3 text-xs gap-1`) và thanh cuộn mượt không hiện scrollbar thô.
    - Hiển thị pill badge đếm số lượng đơn hàng thực tế cho từng tab (`count > 0`).
  - **Hiển Thị Đúng Trạng Thái Kiện Hàng Trong Chi Tiết Đơn Hàng (`CustomerOrderDetailView.tsx`)**:
    - Bổ sung hàm tiện ích `getShipmentStatusBadge`: ánh xạ mã trạng thái số nguyên của bảng vận chuyển (1..6) sang badge tiếng Việt rõ ràng (*"Chờ lấy hàng"*, *"Đang vận chuyển"*, *"Giao hàng thành công"*, *"Đã hoàn trả"*, *"Đã hủy"*, *"Thất bại"*).
    - Thay thế text in số thô `Trạng thái kiện hàng: {shipment.status}` bằng badge chuẩn `getShipmentStatusBadge(shipment.status)`.
    - Ràng buộc nút "Đã nhận hàng thành công" (`canCustomerCompleteOrRefund`): chỉ khả dụng khi đơn hàng đã ở trạng thái `Delivered`.
  - **Đồng Bộ Bộ Lọc Trạng Thái & Nút Thao Tác Cho Người Bán / Quản Trị (`OrdersView.tsx`, `AdminOrdersView.tsx`)**:
    - Thêm các tùy chọn `Returning` ("Đang trả hàng") và `Refunded` ("Đã hoàn tiền") vào dropdown bộ lọc của Seller và Admin.
    - Bổ sung nút hành động "Chuẩn bị hàng" (`handleOpenPackaging`) trực tiếp trên từng hàng của bảng đơn hàng khi trạng thái là `Processing`.
    - Khóa cell trạng thái với `whitespace-nowrap` chống co giật giao diện.
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Succeeded in 729ms, 0 errors.
- [x] Tinh Giản 6 Trạng Thái Vận Chuyển (ShipmentStatus), Xử Lý Chuyển Trạng Thái Tuần Tự Phía Webhook & Cập Nhật Giao Diện AdminShipmentsView:
  - **Tinh Giản Enum Trạng Thái Vận Chuyển (`ShipmentStatus.cs`, `Shipment.cs`)**:
    - Rút gọn enum vận chuyển từ 10 trạng thái cồng kềnh thành 6 trạng thái chuẩn:
      - `ReadyToPick = 1`: Đã tạo đơn thành công, chờ/đang lấy hàng từ Shop (gom nhóm Created, ReadyToPick, Picking).
      - `InTransit = 2`: Đang vận chuyển (đã rời kho lấy / đang trung chuyển / đang giao).
      - `Delivered = 3`: Giao hàng thành công (Terminal State).
      - `Returned = 4`: Đã hoàn trả hàng về Shop thành công (Terminal State).
      - `Cancelled = 5`: Đã hủy đơn vận chuyển (Terminal State).
      - `Failed = 6`: Lỗi / Tạo đơn ĐVVC thất bại (Terminal State).
  - **Chuẩn Hóa Xử Lý Webhook & Kiểm Soát Chuyển Trạng Thái Tuần Tự (`WebhooksController.cs`)**:
    - Ánh xạ linh hoạt chuỗi trạng thái từ đơn vị vận chuyển (GHN) về enum chuẩn:
      - `ready_to_pick`, `readytopick`, `picking`, `storing` $\rightarrow$ `ShipmentStatus.ReadyToPick`.
      - `delivering`, `in_transit`, `intransit`, `transporting` $\rightarrow$ `ShipmentStatus.InTransit`.
      - `delivered` $\rightarrow$ `ShipmentStatus.Delivered`.
      - `cancel`, `cancelled` $\rightarrow$ `ShipmentStatus.Cancelled`.
      - `return`, `returned` $\rightarrow$ `ShipmentStatus.Returned`.
    - Chặn cập nhật khi đơn hàng đã ở trạng thái kết thúc (Terminal State: `Delivered`, `Cancelled`, `Returned`, `Failed`), trả về HTTP 400 Bad Request kèm thông báo tiếng Việt rõ ràng.
    - Ép buộc quy trình chuyển trạng thái giao nhận tuần tự:
      - Chỉ cho phép chuyển sang `InTransit` khi trạng thái hiện tại là `ReadyToPick`.
      - Chỉ cho phép chuyển sang `Delivered` khi trạng thái hiện tại là `InTransit`.
      - Ngăn chặn nhảy cóc trạng thái (ví dụ từ `ReadyToPick` nhảy thẳng sang `Delivered`), trả về HTTP 400 Bad Request giải thích nguyên nhân.
  - **Cập Nhật Giao Diện Quản Trị Vận Chuyển Phía Frontend (`AdminShipmentsView.tsx`)**:
    - Chuẩn hóa Axios Client: Chuyển đổi import sang `import { api } from "@/core";`.
    - Hiển thị badge trạng thái chính xác theo 6 trạng thái mới: 1: Chờ lấy hàng, 2: Đang vận chuyển, 3: Giao hàng thành công, 4: Đã hoàn trả, 5: Đã hủy, 6: Thất bại.
    - Tự động lọc tùy chọn cập nhật (Dropdown trong Modal Mô phỏng Webhook):
      - Đơn hàng đang ở "Chờ lấy hàng" (`ReadyToPick`): Chỉ hiển thị tùy chọn "Đang vận chuyển" (`delivering`).
      - Đơn hàng đang ở "Đang vận chuyển" (`InTransit`): Chỉ hiển thị tùy chọn "Giao hàng thành công" (`delivered`).
      - Đơn hàng ở trạng thái kết thúc: Khóa thao tác và hiển thị nhãn "Đơn hàng đã ở trạng thái kết thúc".
    - Nút thao tác nhanh trên từng hàng trong bảng danh sách:
      - Với đơn `ReadyToPick`: Hiển thị nút "Vận chuyển" (kích hoạt webhook chuyển sang `delivering`).
      - Với đơn `InTransit`: Hiển thị nút "Giao hàng" (kích hoạt webhook chuyển sang `delivered`).
      - Với đơn đã kết thúc (`Delivered`, `Returned`, `Cancelled`, `Failed`): Hiển thị badge xám "Hoàn tất" và vô hiệu hóa nút chuyển.
    - Modal Popups: Bọc toàn bộ modal (Mô phỏng Webhook và Xem lịch trình đơn hàng) qua `createPortal(..., document.body)` với `z-[10000]` chống tràn layout.
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build src/Services/Shippings/Ecommerce.Services.Shippings.Api/Ecommerce.Services.Shippings.Api.csproj -t:Compile` $\rightarrow$ ✅ Succeeded, 0 Error.
    - Frontend: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Succeeded in 897ms, 0 Error.
- [x] Sửa Lỗi Tạo Voucher Trùng Lặp (FE Debounce & BE Unique Index), Nâng z-index Toast, Validate Biến Thể & Pipeline Exception (Catalog.Api), Tối Ưu UX ProductDetailPage, Chống Ghi Đè Khi Edit, Tách Query Handler & Chuyển Đổi Kích Thước/Khối Lượng Sang Số Nguyên (`int`) Kèm EF Core Migrations:
  - **Khắc Phục Tạo Trùng Lặp Voucher (Double Submission) & Ràng Buộc Mã Duy Nhất (`AdminVouchersView.tsx`, `CouponsView.tsx`, `OrderDbContext.cs`)**:
    - **Nguyên nhân**: Frontend không debounce hoặc disable nút Lưu khi mutation đang gửi; Backend chưa có unique constraint cho `Voucher.Code` khiến double-click tạo ra 2 bản ghi cùng mã code.
    - **Giải pháp**:
      - Bổ sung guard check `isPending` và disable submit button kèm spinner `Loader2` trong `AdminVouchersView.tsx` và `CouponsView.tsx`.
      - Bổ sung `entity.HasIndex(v => v.Code).IsUnique();` trong `OrderDbContext.cs`.
      - Dọn dẹp bản ghi trùng lặp cũ trong `OrderDb` và áp dụng migration `Update_Metrics_To_Int_And_Voucher_Code_Unique`.
  - **Nâng Cấp `z-index` Cho Toast Thông Báo (`index.css`, `App.tsx`)**:
    - Thiết lập `z-index: 999999 !important` cho `.Toastify__toast-container` trong `index.css` và `App.tsx`, đảm bảo thông báo Toast luôn nổi lên trên cùng, không bị các modal Portal che khuất (đặc biệt là Modal Chat `z-[10000]` - `z-[10002]`).
  - **Pipeline Exception Handling & Validate Giá Giảm < Giá Bán (`Catalog.Api`, `BuildingBlocks.Web`, `ProductVariantSection.tsx`, `EditProductPage.tsx`)**:
    - `BuildingBlocks.Web`: Thêm phương thức mở rộng `UseBuildingBlocksMiddlewares` đăng ký `GlobalExceptionMiddleware`.
    - `Catalog.Api` & `Orders.Api`: Đăng ký `app.UseBuildingBlocksMiddlewares();` trong `Program.cs`. `GlobalExceptionMiddleware` bắt `FluentValidationException` từ MediatR `ValidationBehavior` và trả về HTTP 400 Bad Request tiếng Việt thay vì lỗi 500 Unhandled Exception.
    - `UpdateMultiVariantsCommandValidator` & `UpdateSingleVariantCommandValidator`: Bổ sung rule `.LessThan(v => v.Price).When(...).WithMessage("Giá giảm phải nhỏ hơn giá bán.")`.
    - `ProductVariantSection.tsx` & `EditProductPage.tsx`: Validate chặn trước khi submit; Bulk Update tự động bỏ qua biến thể không hợp lệ và cảnh báo `toast.warn`; hiển thị viền đỏ và text lỗi `"Phải nhỏ hơn giá bán"`.
  - **Tối Ưu Hiển Thị Chi Tiết Sản Phẩm (`ProductDetailPage.tsx`, `ProductPrice.tsx`, `ProductOptions.tsx`)**:
    - Giá hiển thị cố định đúng 1 dòng (`whitespace-nowrap min-h-[52px]`), không nhảy dòng hay làm phình to box chứa giá.
    - Hiển thị khoảng giá giảm `minDiscountPrice - maxDiscountPrice` kèm khoảng phần trăm `(-min% ~ -max%)` trên cùng dòng; gỡ bỏ giá gạch ngang và badge giảm giá tách rời.
    - Nhóm phân loại 2 (tierIndex > 0): Hoàn toàn không render thẻ `<img>`, chỉ Option 1 mới hiển thị thumbnail.
    - Kiểm tra tổ hợp biến thể theo thời gian thực: Tự động làm mờ, gạch ngang và vô hiệu hóa click (`opacity-40 cursor-not-allowed pointer-events-none line-through`) đối với phân loại không có biến thể tương ứng hoặc đã hết hàng (`availableStock <= 0`).
  - **Chiến Lược Query & Mutation Chống Ghi Đè Khi Đang Edit (`EditProductPage.tsx`)**:
    - Thêm ref `hasInitializedRef` bảo vệ form hydration; chỉ khởi tạo form từ server data 1 lần duy nhất khi load trang hoặc đổi ID sản phẩm, tuyệt đối không để background query refetch ghi đè dữ liệu khi người dùng đang nhập dở.
  - **Tách Riêng Query Handler Theo CQRS (`GetSubOrderDetailQueryHandler.cs`)**:
    - Tạo file riêng `GetSubOrderDetailQueryHandler.cs` trong `Features/Orders/Queries/GetSubOrderDetail/`, dọn dẹp `GetSubOrderDetailQuery.cs` chỉ chứa record và DTO theo đúng quy chuẩn kiến trúc dự án.
  - **Chuyển Đổi Toàn Bộ Kích Thước & Khối Lượng Sang Số Nguyên (`int` / `int32`) Phục Vụ GHN & Sửa Lỗi Float**:
    - Chuyển `Weight` (grams), `Length`, `Width`, `Height` (cm) từ `double` sang `int` trên các entity `SubOrderItem`, `Product`, `Shipment`, domain methods, constructors, DTOs, và các consumers.
    - Chuẩn hóa toàn bộ Protobuf contracts (`product.proto`, `shipping.proto`, `cart.proto`): chuyển `weight`, `length`, `width`, `height` từ `double` sang `int32`.
    - Đồng bộ `ShippingGrpcServer.cs`, `CartClientService.cs`, `ProductGrpcService.cs` map trực tiếp `int` không cần ép kiểu `(int)Math.Round`.
    - Frontend: Bọc `Math.round(...)` khi tính toán kích thước, thể tích và khối lượng kiện hàng đóng gói trong `OrdersView.tsx`, `PackageReadyModal.tsx`, `CustomerOrderDetailView.tsx`, triệt tiêu hoàn toàn số thực dài `144.29999999999998`.
    - Tạo và cập nhật thành công 3 EF Core Migrations lên PostgreSQL:
      - `Orders.Api`: `Update_Metrics_To_Int_And_Voucher_Code_Unique`
      - `Catalog.Api`: `Update_Product_Metrics_To_Int`
      - `Shippings.Api`: `Update_Shipment_Metrics_To_Int`
  - **Kiểm Thử & Biên Dịch**:
    - Backend: `dotnet build Microservices.sln` $\rightarrow$ ✅ Build Succeeded, 0 Error.
    - Frontend: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Built in 616ms, 0 Error.
- [x] Phân Quyền Route Frontend Rõ Ràng (`AppRoutes.tsx`, `RequireAuth.tsx`, `RequireAdmin.tsx`, `authHelper.ts`) & Khắc Phục Triệt Để Lỗi PostgreSQL Connection Timeout 15s Khi Đọc Stream Trên Toàn Bộ Microservices:
  - **Phân Quyền Route & Điều Hướng Đăng Nhập Frontend (`AppRoutes.tsx`, `RequireAuth.tsx`, `RequireAdmin.tsx`, `authHelper.ts`)**:
    - **Vấn đề**: Các trang cá nhân và người bán (`/cart`, `/checkout`, `/wishlist`, `/chat`, `/profile`, `/orders`, `/orders/:subOrderId`, `/seller`, `/seller/register`, `/seller/*`) trước đây chưa có route guard, nếu người dùng chưa đăng nhập truy cập bằng link sẽ bị crash hoặc hiện màn hình lỗi kết nối do thiếu accessToken. Ngoài ra, `/admin/*` khi chưa đăng nhập lại bị redirect về `/` thay vì trang login.
    - **Giải pháp**:
      - Xây dựng component `RequireAuth`: kiểm tra `accessToken` và `isAuthenticated(token)` (kèm hạn dùng JWT exp). Nếu chưa đăng nhập, tự động chuyển hướng về `/login?redirect=${encodeURIComponent(location.pathname + location.search)}` và lưu `state: { from: location }`.
      - Xây dựng component `RequireAdmin`: kiểm tra `isAuthenticated()` và `checkIsAdmin()`. Nếu chưa login $\rightarrow$ chuyển về `/login?redirect=/admin`; nếu đã login nhưng không phải Admin $\rightarrow$ thông báo toast "Bạn không có quyền truy cập vào trang Quản trị" và chuyển hướng về `/`.
      - Cấu trúc lại `AppRoutes.tsx` tách bạch 4 nhóm rõ ràng: Public Routes, Customer Protected Routes (bọc `RequireAuth`), Seller Protected Routes (bọc `RequireAuth`), Admin Protected Routes (bọc `RequireAdmin`), và Auth Routes (`/login`, `/register`...).
      - Thử nghiệm biên dịch: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Succeeded (1.27s), 0 error.
  - **Sửa Triệt Để Lỗi Database Timeout (`System.TimeoutException: Timeout during reading attempt`) Khi Đọc Stream Trên Hầu Như Các Services (`Sellers`, `Orders`, `Payments`, `Shippings`, `Identity`, `Notifications`, `Catalogs`)**:
    - **Nguyên nhân gốc**: PostgreSQL chạy trong Docker container, ánh xạ port `5433:5432`. Trong `appsettings.json`, các service cấu hình `Host=localhost;Port=5433`. Trên Windows 10/11 chạy Docker Desktop (WSL2), `localhost` được phân giải ra IPv6 `[::1]`. Khi Npgsql mở kết nối stream, proxy IPv6 của Docker Desktop/WSL2 nhận TCP SYN ban đầu nhưng bị drop hoặc nghẽn luồng byte trả về từ container PostgreSQL Linux, khiến `NpgsqlReadBuffer.EnsureLong` bị treo chờ 15s và văng `Timeout during reading attempt` ở `BusOutboxDeliveryService` hoặc DbContext.
    - **Giải pháp**:
      - Đổi `Host=localhost;Port=5433` thành `Host=127.0.0.1;Port=5433` trong chuỗi kết nối `ConnectionStrings:Database` của cả 7 microservices (`Sellers`, `Orders`, `Payments`, `Shippings`, `Identity`, `Notifications`, `Catalogs`).
      - Chạy kiểm chứng thực tế: `Sellers.Api` và `Orders.Api` khởi động kết nối ngay lập tức, `BusOutboxDeliveryService` hoạt động liên tục và trơn tru không còn bất kỳ timeout nào.
      - Biên dịch solution: `dotnet build Microservices.sln` $\rightarrow$ ✅ 0 Error.
- [x] Khắc Phục Triệt Để Lỗi Không Gửi Được Tin Nhắn Trong Mini Chat & Sửa Lỗi Hở Viền Review Ảnh/Video (`ChatMiniModal.tsx`, `ChatImageViewer.tsx`, `useChatStore.ts`, `chat.constants.ts`):
  - **Sửa Lỗi Không Gửi Được Tin Nhắn Trong Mini Chat (`ChatMiniModal.tsx`, `chat.constants.ts`, `useChatStore.ts`)**:
    - **Nguyên nhân gốc**:
      1) Khi người dùng mở chat với shop (`openChatWithShop`), `isSeller` trong store có thể đang mang giá trị `true` do lưu trong `localStorage`. Hàm cũ không reset `isSeller` về `false` và gán `buyerUserId = 0`, khiến logic cũ tính `recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId` ra kết quả bằng `0`. Hub backend kiểm tra `recipientId <= 0` hoặc sai vai trò dẫn tới từ chối hoặc lỗi.
      2) `targetRoomId` khi phòng chưa có GUID hợp lệ (ví dụ: `room-shop-12`) bị truyền `null` thay vì chuỗi GUID rỗng `"00000000-0000-0000-0000-000000000000"`, gây bất tương thích với Hub dispatcher.
      3) `useChatStore.setMessages` ban đầu chỉ nhận array thuần `ChatMessageDto[]`. Khi `ChatMiniModal` gọi dạng functional updater `setMessages((prev) => ...)`, Zustand lưu trực tiếp hàm updater vào state thay vì mảng tin nhắn, dẫn tới crash hoặc mất tin nhắn.
    - **Giải pháp toàn diện**:
      - Bổ sung hàm tiện ích `getChatParticipantInfo(activeRoom, currentUserId, isSeller)` trong `chat.constants.ts`: tự động phân giải chính xác `recipientId` và `senderRole` cho cả 2 vai trò Buyer và Seller, đảm bảo `recipientId` không bao giờ bằng `0` hoặc `NaN`.
      - Đồng bộ tham số `targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000"` cho tất cả các luồng gửi tin nhắn (Văn bản, Nhóm Ảnh, Nhóm Video, Nhãn dán 3D, Ảnh GIF) giống 100% với `ChatPage.tsx`.
      - Nâng cấp `setMessages` trong `useChatStore.ts` hỗ trợ an toàn `ChatMessageDto[] | ((prev: ChatMessageDto[]) => ChatMessageDto[])`.
      - Trong `openChatWithShop`: Luôn chủ động reset `isSeller: false`, `selectedShop: null`, và cập nhật `localStorage: buu_chat_is_seller = false`.
      - Cách ly và bảo vệ `tempMsgs` theo từng `roomId`: khi chuyển phòng hoặc tải lại lịch sử, chỉ giữ tin nhắn tạm thời của chính phòng chat đó.
  - **Khắc Phục Lỗi FE Khi Review Ảnh/Video (`ChatImageViewer.tsx`)**:
    - **Nguyên nhân gốc**: Trong phiên bản trước, `.yarl__thumbnails_container` bị thu hẹp chiều ngang bằng CSS `max-width: calc(100% - 160px); margin: 0 auto`. Do Lightbox xếp carousel và thumbnail theo chiều dọc bên trong flex container, việc thu hẹp thumbnail container tạo ra khoảng hở trong suốt ở 2 góc đáy màn hình, khiến thanh nhập liệu màu trắng của khung chat bên dưới bị lộ ra ngoài.
    - **Giải pháp toàn diện**:
      - Mở rộng dải thumbnails phủ trọn 100% bề ngang: `width: 100% !important; max-width: 100% !important; margin: 0 !important; background-color: rgba(0, 0, 0, 0.96) !important; padding: 12px 90px !important; box-sizing: border-box !important;`.
      - Phủ nền đen mờ `rgba(0, 0, 0, 0.96)` đồng nhất trên toàn bộ `.yarl__portal`, `.yarl__root`, `.yarl__container`, `.yarl__thumbnails`, và `.yarl__thumbnails_container`.
      - Đưa Lightbox vào portal `document.body` tránh bị ảnh hưởng bởi stacking context hoặc padding của modal cha.
      - Giữ nguyên toàn bộ tính năng cao cấp: các nút điều hướng Trái/Phải dạng tròn floating nổi giữa màn hình (bấm padding 2 bên không bị nhảy slide), click backdrop ngoài ảnh/video tự động đóng, nút Close góc trên hoạt động tin cậy, chống duplicate audio cho video (`autoPlay: false`, tự động pause và reset khi đổi slide).
  - **Kiểm Thử & Biên Dịch**:
    - Frontend: `npm run build` (`frontend-web`) $\rightarrow$ ✅ Succeeded (901ms), 4,272 modules transformed, 0 error.
