# 🛒 Hệ thống Thương mại Điện tử Đa Cửa Hàng (Ecommerce Microservices Platform)

Hệ thống Thương mại Điện tử Marketplace doanh nghiệp được phát triển theo kiến trúc **Microservices** tiên tiến với **.NET 9**, **Clean Architecture**, **CQRS MediatR**, **MassTransit Saga Outbox**, và **React 19 Frontend**.

---

## 🏛️ 1. Tổng quan Kiến trúc Hệ thống (System Architecture)

```
[ React 19 Frontend ] 
       │ (HTTP REST / JSON)
       ▼
[ YARP API Gateway ] ── (CORS / Rate Limit / Routing) 
       │
       ├──► Catalog.Api    (REST 5001 / gRPC 5002) ──► MySQL
       ├──► Cart.Api       (REST 5004 / gRPC 5005) ──► Redis
       ├──► Orders.Api     (REST 5007 / gRPC 5008) ──► PostgreSQL
       ├──► Payments.Api   (REST 5052 / gRPC 5053) ──► PostgreSQL
       ├──► Shippings.Api  (REST 5070 / gRPC 5071) ──► PostgreSQL
       ├──► Sellers.Api    (REST 5042 / gRPC 5043) ──► PostgreSQL
       └──► Identity.Api   (REST 5027 / gRPC 5028) ──► PostgreSQL
       
[ Sync Comm ]: gRPC (Internal Protocol Buffers)
[ Async Comm ]: MassTransit + RabbitMQ (Event-Driven Saga State Machine)
```

---

## 🛠️ 2. Bảng Mã Port & Công Nghệ (Services & Ports Matrix)

| Microservice | REST Port | gRPC Port | Database | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog.Api** | `5001` | `5002` | MySQL | Sản phẩm (EAV), Biến thể SKU, Tồn kho, Ratings & Reviews |
| **Cart.Api** | `5004` | `5005` | Redis | Giỏ hàng phiên bản Redis, Gom nhóm sản phẩm theo Shop |
| **Orders.Api** | `5007` | `5008` | PostgreSQL | Đơn hàng, Tách SubOrders per Shop, Vouchers, Refund Saga |
| **Identity.Api** | `5027` | `5028` | PostgreSQL | OAuth2 / OIDC JWT, Sổ địa chỉ người dùng |
| **Sellers.Api** | `5042` | `5043` | PostgreSQL | Định danh KYC Người bán, Quản lý Cửa hàng, Địa chỉ lấy hàng |
| **Payments.Api** | `5052` | `5053` | PostgreSQL | Momo, VNPay, COD, Ví Điện tử Shop, Rút tiền Ngân hàng |
| **Shippings.Api** | `5070` | `5071` | PostgreSQL | Tích hợp GHN (Giao Hàng Nhanh), Đồng bộ địa danh, Webhooks |
| **Notifications.Api**| `5080` | - | Redis | SignalR Real-time Notifications & Chat |

---

## ✨ 3. Bản đồ Nghiệp vụ Đã Triển khai (Implemented Business Capabilities)

### 🏬 A. Người Bán & Quản lý Cửa hàng (Seller Center)
- **Định danh KYC (`Sellers.Api`)**: Đăng ký thông tin định danh CCCD (ảnh mặt trước/sau), quy trình xét duyệt `Draft` ➔ `Submitted` ➔ `Approved` / `Rejected`.
- **Quản lý Cửa hàng (`Sellers.Api`)**: Tạo Shop sau khi duyệt KYC, quản lý thông tin Shop & Địa chỉ lấy hàng (`PickUpAddress` chuẩn GHN).
- **Ví Người Bán & Rút tiền (`Payments.Api`)**: Kích hoạt ví điện tử, liên kết tài khoản ngân hàng, xem lịch sử biến động dư nợ giao dịch, gửi yêu cầu rút tiền về ngân hàng.

### 🛍️ B. Quản lý Sản phẩm & Giỏ hàng (Catalog & Cart)
- **Sản phẩm EAV (`Catalog.Api`)**: Tạo sản phẩm, biến thể (Variants), tùy chọn (Options), thuộc tính kích thước/trọng lượng cho vận chuyển. Bật/tắt trạng thái kinh doanh.
- **Đánh giá & Nhận xét (`Catalog.Api`)**: Đánh giá số sao, comment, upload media. Kiểm tra điều kiện qua gRPC: Số lần review <= Số đơn hàng thành công chứa sản phẩm.
- **Giỏ hàng Redis (`Cart.Api`)**: Thêm/Sửa/Xóa sản phẩm, chọn sản phẩm tính tiền, gom nhóm sản phẩm theo Shop.

### 🛒 C. Đặt hàng & Thanh toán (Checkout, Orders & Payments)
- **Tính tổng chi phí Checkout (`Orders.Api`)**: Tính chi phí tạm tính, giảm giá Voucher Shop, Voucher Sàn, và gọi gRPC Shipping tính phí vận chuyển hàng loạt từ GHN.
- **Tạo Đơn hàng Đa Cửa hàng (`Orders.Api`)**: Tách 1 đơn hàng thành nhiều `SubOrder` theo từng Shop.
- **Saga State Machine SubOrder**: Quản lý vòng đời `AwaitingPayment` ➔ `AwaitingConfirmation` ➔ `Processing` ➔ `PackageReady` ➔ `Shipping` ➔ `Delivered` ➔ `Completed` ➔ `Cancelled` / `Refunded`.
- **Thanh toán Momo & VNPay (`Payments.Api`)**: Thanh toán Sandbox Momo QR, VNPay. Webhook tự động kích hoạt `PaymentSucceededEvent` ➔ `OrderService` chuyển SubOrder sang `AwaitingConfirmation`.
- **Hoàn tiền / Đổi trả (`Orders.Api` & `Payments.Api`)**: Người mua gửi yêu cầu hoàn tiền, Seller duyệt/từ chối, tiền tự động hoàn trả qua `RefundSubOrderConsumer`.

### 🚚 D. Vận chuyển GHN (Shippings)
- Đồng bộ danh mục Tỉnh/Huyện/Xã chuẩn GHN API.
- Tự động tạo vận đơn GHN qua Event Consumer `CreateShipmentConsumer`.
- Webhook GHN nhận trạng thái giao hàng `Delivered` ➔ `Shippings.Api` ➔ Bắn `ShipmentDeliveredEvent` ➔ `OrderService` chuyển `SubOrder` sang `Delivered` ➔ `SellerRevenueConsumer` tự động cộng tiền doanh thu vào Ví người bán.

---

## 📐 4. Standards & Architectural Design

1. **CQRS & Clean Architecture**:
   - Tách biệt 2 file độc lập: `[Name]Query.cs` / `[Name]Command.cs` và `[Name]QueryHandler.cs` / `[Name]CommandHandler.cs`.
2. **gRPC Presentation Adapter Pattern**:
   - `GrpcServer.cs` chỉ là Presentation layer, ủy quyền xử lý qua MediatR `ISender.Send(...)`.
3. **gRPC Client Service Abstraction**:
   - Gọi gRPC inter-service qua class `grpcClientService` (`ProductClientService`, `SellerClientService`...) bọc `RpcException` thành `Result<T>`.
4. **UnitOfWork & Generic Repository Pattern**:
   - Quản lý giao dịch và truy vấn qua `IEfUnitOfWork` và `IGenericEfRepository<T>`.
5. **MassTransit Saga & Transactional Outbox Pattern**:
   - Đảm bảo tính nhất quán dữ liệu sự kiện giữa database commit và RabbitMQ message publish.
6. **Frontend React 19 ACO Architecture**:
   - Tách biệt rõ ràng theo cấu trúc 3 tầng: `apps/` (Các trang hoàn chỉnh phân theo vai trò User/Seller/Admin/Auth), `domains/` (Domain logic, API, Hooks, Types, Sub-components) và `shared/` (Utilities dùng chung).
   - Modal Popups bắt buộc dùng `createPortal(..., document.body)` với `z-10000`.
   - Error handling bắt lỗi theo HTTP Status Code (400, 404, 500) và `Result.ErrorCode`.

---

## 🚀 5. Hướng dẫn Chạy Hệ thống (Getting Started)

### Yêu cầu Môi trường:
- .NET 9 SDK
- Node.js v20+ & npm
- Docker Desktop (PostgreSQL, MySQL, Redis, RabbitMQ)

### Khởi chạy Infrastructure qua Docker:
```bash
docker compose up -d
```

### Khởi chạy Backend Microservices:
```bash
# Mở solution trong Visual Studio / Rider hoặc chạy bằng CLI
dotnet build Microservices.sln
```

### Khởi chạy Frontend React Web App:
```bash
cd frontend-web
npm install
npm run dev
```
Trang web sẽ chạy tại `http://localhost:5173`.