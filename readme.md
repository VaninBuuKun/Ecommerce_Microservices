# Hệ thống Thương mại Điện tử (Ecommerce Microservices)

Hệ thống được phát triển theo kiến trúc **Microservices** hiện đại sử dụng **.NET 9**, áp dụng **CQRS pattern** và kiến trúc Clean Architecture.

---

# 🎯 Giới thiệu Dự án
Đây là hệ thống thương mại điện tử theo mô hình Marketplace, nơi nhiều người bán có thể đăng tải và quản lý sản phẩm của mình trên cùng một nền tảng, trong khi người mua có thể tìm kiếm, đặt hàng và thanh toán trực tuyến một cách thuận tiện.

## 🛠️ Công nghệ cốt lõi

*   **Backend:** .NET 9 (ASP.NET Core), EF Core 9.
*   **Database:** PostgreSQL (hầu hết dịch vụ), MySQL (Catalog Service), Redis (Cart Service & Cache).
*   **Message Broker:** MassTransit + RabbitMQ (Xử lý sự kiện bất đồng bộ & Saga Pattern).
*   **API Gateway:** YARP (Yet Another Reverse Proxy).
*   **Communication:** gRPC (Đồng bộ giữa các microservices) & SignalR (Real-time notifications & Chat).
*   **Logging & Tracing:** Serilog, OpenTelemetry, Grafana, Loki, Tempo.
*   **Object Storage:** MinIO.

---

## 🏛️ Kiến trúc hệ thống
```text
       [ Client Apps ]
             │
             │ (1) HTTP/HTTPS
             ▼
    +───────────────────────+
    |   YARP API Gateway    | 
    +───────────────────────+
             │
             │ (2) HTTP (Api Gateway to Service)
      +──────┴───────┬───────┴──────+
      │              │              │
+─────▼─────┐  +─────▼─────┐  +─────▼─────┐
| Identity  |  |  Catalog  |  |   Order   | ... (Other Services)
+─────┬─────┘  +─────┬─────┘  +─────┬─────┘
      │              │              │
      └──────┬───────┴──────┬───────┘
             │              │ (3) gRPC (Service-to-Service)
             ▼              ▼
     +────────────────+   +──────────────────────+
     |   RabbitMQ     |   | Database-Per-Service |
     | (Event Bus)    |   | (PostgreSQL/SQL)     |
     +────────────────+   +──────────────────────+
```

## 🏗️ Cấu trúc dự án (7 Microservices)

Dự án được phân chia thành các service độc lập phục vụ cho từng nghiệp vụ cụ thể:

1.  **Identity Service:** Quản lý tài khoản, phân quyền (Admin, Seller, Buyer), xác thực thông qua JWT Bearer. Sử dụng PostgreSQL.
2.  **Catalog Service:** Quản lý sản phẩm, danh mục, biến thể, upload ảnh, video (S3 MinIO).
3.  **Cart Service:** Lưu trữ giỏ hàng tạm thời dựa trên Redis.
4.  **Order Service:** Quản lý đặt hàng, hoàn trả, voucher.
5.  **Payment Service:** Xử lý thanh toán tích hợp cổng VNPay/Momo và nhận kết quả qua Webhook. Quản lý thanh toán, ví tiền, giao dịch, yêu cầu rút tiền.
6.  **Shipping Service:** Tích hợp đơn vị vận chuyển thứ ba (ví dụ GHN).
7.  **Notification Service:** Cung cấp các kết nối SignalR thời gian thực phục vụ việc hiển thị thông báo đẩy (System Notifications) và hệ thống Chat trực tiếp giữa người mua (Buyer) và người bán (Seller) theo từng mã đơn hàng con
8.  **Seller Service**: Quản lý shop, đăng kí KYC.
---

## ✨ Các tính năng cốt lõi
* **Customer**: 
  * Đăng ký / Đăng nhập
  * Tìm kiếm sản phẩm
  * Giỏ hàng
  * Thanh toán
  * Theo dõi đơn hàng
* **Seller**: 
  * Quản lý shop
  * Quản lý sản phẩm, biến thể, giá, tồn kho
  * Xử lý đơn hàng
  * Thêm voucher cho shop
* **Admin**:
  * Quản lý người dùng
  * Quản lý danh mục
  * Kiểm duyệt Kyc
  * Thêm voucher toàn sàn

## 📂 Cấu trúc dự án
```text
src/
├── ApiGateways/
│   └── Yarp.Gateway/
├── Services/
│   ├── Identity/
│   │   ├── Identity.API/
│   │   ├── Identity.Application/
│   │   └── Identity.Infrastructure/
│   ├── Products/
│   ├── Orders/
│   ├── Payments/
│   └── ...
└── BuildingBlocks/
    ├── BuildingBlocks.Shared/
    ├── BuildingBlocks.EfCore/
    ├── BuildingBlocks.Grpc/
    ├── BuildingBlocks.Caching/
    └── ...
  ```