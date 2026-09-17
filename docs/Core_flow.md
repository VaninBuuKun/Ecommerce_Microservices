# 🛒 KIẾN TRÚC & SƠ ĐỒ LUỒNG ĐƠN HÀNG (ORDER FLOW ARCHITECTURE)
> **Dự án**: Ecommerce Microservices (.NET 9 + MassTransit/RabbitMQ + React 19 + GHN Logistics)  

> **Dán mã** : [https://mermaid.live/](https://mermaid.live/)
---

## 📑 Mục Lục
1. [Sơ Đồ Tổng Quan Vòng Đời Đơn Hàng (Architecture Overview)](#1-sơ-đồ-tổng-quan-vòng-đời-đơn-hàng-dễ-hiểu-cho-mọi-người)
2. [Sơ Đồ Tuần Tự Toàn Diện (End-to-End Sequence Diagram)](#2-sơ-đồ-tuần-tự-toàn-diện-end-to-end)
   - 2.1. Giai đoạn 1: Phỏng tính Checkout & Lưu Session Redis
   - 2.2. Giai đoạn 2: Tạo Đơn Hàng & Giữ Tồn Kho Phân Tán (Distributed Placement)
   - 2.3. Giai đoạn 3: Thanh Toán Trực Tuyến & IPN Webhook (MoMo / VNPay)
   - 2.4. Giai đoạn 4: Vận Hành Đơn Hàng Phía Người Bán & Tích Hợp GHN (Fulfillment)
   - 2.5. Giai đoạn 5: Hoàn Tất Đơn & Giải Ngân Vào Ví Shop (Escrow Payout)
3. [Sơ Đồ Máy Trạng Thái Saga (SubOrder State Machine Saga)](#3-sơ-đồ-máy-trạng-thái-saga-suborderstatemachine)
4. [Sơ Đồ Quy Trình Trả Hàng / Hoàn Tiền (Reverse Logistics & Refund Flow)](#4-sơ-đồ-quy-trình-trả-hàng--hoàn-tiền-reverse-logistics)
5. [Sơ Đồ Hủy Đơn Hàng & Giao Dịch Bù Trừ (Order Cancellation & Compensation)](#5-sơ-đồ-hủy-đơn-hàng--giao-dịch-bù-trừ-order-cancellation)
6. [Sơ Đồ Giao Hàng Thất Bại & Chuyển Hoàn (Delivery Failure & Return to Sender)](#6-sơ-đồ-giao-hàng-thất-bại--chuyển-hoàn-delivery-failure)
7. [Sơ Đồ Đánh Giá Sản Phẩm & Cập Nhật Điểm Uy Tín (Product Review & Rating)](#7-sơ-đồ-đánh-giá-sản-phẩm--cập-nhật-điểm-uy-tín-product-review)
8. [Sơ Đồ Rút Tiền Từ Ví Người Bán (Seller Wallet Withdrawal Flow)](#8-sơ-đồ-rút-tiền-từ-ví-người-bán-seller-wallet-withdrawal)
9. [Sơ Đồ Đăng Ký Cửa Hàng & Duyệt Hồ Sơ KYC (Seller Onboarding & KYC Approval)](#9-sơ-đồ-đăng-ký-cửa-hàng--duyệt-hồ-sơ-kyc-seller-onboarding)
10. [Sơ Đồ Mua Lại Đơn Hàng Nhanh (Re-order Flow)](#10-sơ-đồ-mua-lại-đơn-hàng-nhanh-re-order-flow)

---

## 1. Sơ Đồ Tổng Quan Vòng Đời Đơn Hàng (Dễ Hiểu Cho Mọi Người)
Sơ đồ dưới đây được thiết kế trực quan, phân theo **5 Bước Đời Thực** (từ lúc Khách chọn đồ đến khi Tiền về ví Shop), giúp bất kỳ ai (kể cả người không rành kỹ thuật) cũng có thể hiểu rõ luồng vận hành chỉ trong 2 phút:

```mermaid
flowchart TD
    classDef client fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef orderSvc fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef external fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef infra fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;

    subgraph G1 ["🛒 BƯỚC 1: NGƯỜI MUA CHỌN ĐỒ & TÍNH TIỀN"]
        Buyer(["👤 Người Mua (Web React)"]):::client
        OrderCalc["📦 Orders.Api: Tính Tổng Tiền<br/>(Tiền hàng + Phí ship GHN - Mã giảm giá)"]:::orderSvc
        ShippingCalc["🚚 Shippings.Api: Hỏi Cước Vận Chuyển"]:::orderSvc
        GHN_Calc["🏢 GHN: Tính Phí Theo Khoảng Cách & Cân Nặng"]:::external
        RedisLock[("⚡ Redis: Khóa Tạm Bảng Tính Tiền Trong 15 Phút<br/>(Giữ giá cố định, không bị nhảy giá lúc trả tiền)")]:::infra

        Buyer -->|1. Bấm Mua hàng trong giỏ| OrderCalc
        OrderCalc -->|Hỏi cước vận chuyển từng shop| ShippingCalc
        ShippingCalc -->|Gọi API GHN tính cước| GHN_Calc
        GHN_Calc -.->|Báo giá ship| ShippingCalc
        ShippingCalc -.->|Tổng hợp cước ship| OrderCalc
        OrderCalc -->|Lưu tạm bảng tính tiền 15 phút| RedisLock
    end

    subgraph G2 ["⚡ BƯỚC 2: CHỐT ĐƠN & GIỮ HÀNG TRÁNH HẾT KHO"]
        CatalogHold["🏷️ Catalog.Api: Giữ Hàng Trong Kho Tức Thì<br/>(Tránh 2 người cùng tranh mua 1 cái áo cuối cùng)"]:::orderSvc
        OrderSplit["📦 Orders.Api: Tách Đơn Hàng Con Theo Từng Shop<br/>(Mua 3 Shop -> Sinh 3 đơn con độc lập)"]:::orderSvc
        PaymentGate["💳 Payments.Api: Tạo Mã QR / Link Thanh Toán<br/>(Nếu chọn trả qua MoMo / VNPay)"]:::orderSvc
        BusEvent[["📨 RabbitMQ: Phát Loa Thông Báo Toàn Hệ Thống"]]:::infra

        RedisLock -->|2. Khách bấm Xác Nhận Đặt Hàng| OrderSplit
        OrderSplit -->|Khóa tạm số lượng trong kho| CatalogHold
        OrderSplit -->|Tạo link thanh toán nếu chọn trả trước| PaymentGate
        OrderSplit -->|Bắn tin: Đã có đơn hàng mới!| BusEvent
    end

    subgraph G3 ["🏪 BƯỚC 3: NGƯỜI BÁN XỬ LÝ & GỌI SHIPPER"]
        Seller(["🏪 Người Bán (Shop)"]):::client
        SellerConfirm["📦 Orders.Api: Shop Bấm Duyệt Đơn<br/>(Chuyển sang: Đang chuẩn bị hàng)"]:::orderSvc
        SellerPack["📦 Orders.Api: Shop Đóng Hộp & Đo Cân Nặng<br/>(Nhập dài, rộng, cao, khối lượng)"]:::orderSvc
        ShippingCreate["🚚 Shippings.Api: Tự Động Kết Nối GHN"]:::orderSvc
        GHN_Order["🏢 GHN: Cấp Mã Vận Đơn (VD: GHN987654321)"]:::external

        BusEvent -->|Báo cho Shop biết có đơn mới| Seller
        Seller -->|3. Xem và Bấm Duyệt đơn hàng| SellerConfirm
        SellerConfirm -->|Gói hàng bỏ vào thùng| SellerPack
        SellerPack -->|4. Bấm Đã đóng gói xong| BusEvent
        BusEvent -->|Yêu cầu shipper đến kho lấy| ShippingCreate
        ShippingCreate -->|Gọi GHN tạo mã giao hàng| GHN_Order
        GHN_Order -.->|Trả về mã vận đơn GHN cho Shop dán lên kiện| ShippingCreate
    end

    subgraph G4 ["🛵 BƯỚC 4: SHIPPER LẤY HÀNG & GIAO TẬN NHÀ"]
        Shipper(["🛵 Shipper GHN"]):::external
        ShipPickup["🚚 GHN Báo: Shipper Đã Lấy Hàng Tại Kho Shop<br/>(Trạng thái đơn: Đang giao hàng)"]:::orderSvc
        ShipDeliver["🚚 GHN Báo: Shipper Đã Giao Tận Tay Khách<br/>(Trạng thái đơn: Đã giao hàng thành công)"]:::orderSvc

        GHN_Order -.->|Shipper đến kho Shop nhận kiện hàng| Shipper
        Shipper -->|Quét mã: Đã lấy hàng| ShipPickup
        ShipPickup -->|Chạy xe đi giao| Shipper
        Shipper -->|Khách nhận: Đã giao thành công| ShipDeliver
        ShipDeliver -->|Báo cáo hoàn thành giao vận| BusEvent
    end

    subgraph G5 ["💰 BƯỚC 5: KHÁCH HÀI LÒNG & SHOP NHẬN TIỀN"]
        BuyerConfirm["👤 Khách Hàng: Bấm Đã Nhận Được Hàng<br/>(Hoặc hệ thống tự hoàn tất sau 7 ngày)"]:::client
        EscrowPayout["💳 Payments.Api: Rót Tiền Bán Vào Ví Shop<br/>(Tiền hàng - Phí sàn = Tiền Shop thực nhận)"]:::orderSvc
        OrderDone["🎉 Giao Dịch Thành Công 100%"]:::orderSvc

        ShipDeliver -->|Bắt đầu đếm ngược 7 ngày đổi trả| BuyerConfirm
        BuyerConfirm -->|Khách ưng ý, bấm Hoàn tất| BusEvent
        BusEvent -->|Lệnh giải ngân tiền bán hàng| EscrowPayout
        EscrowPayout -->|Cộng tiền vào ví Shop| OrderDone
    end
```

---

## 2. Sơ Đồ Tuần Tự Toàn Diện (End-to-End)

### 2.1. Giai đoạn 1: Phỏng tính Checkout & Lưu Session Redis
Khách hàng chọn danh sách sản phẩm từ giỏ hàng, áp dụng Voucher và địa chỉ giao hàng. Hệ thống tính toán chi tiết phí ship từng shop và giảm giá, sau đó lưu snapshot vào Redis trong 15 phút để đảm bảo giá không bị thay đổi bất ngờ lúc thanh toán.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua (Frontend)
    participant Orders as 📦 Orders.Api
    participant Identity as 👤 Identity.Api (gRPC)
    participant Shipping as 🚚 Shippings.Api
    participant GHN as 🏢 GHN Logistics
    participant Redis as ⚡ Redis Cache

    Buyer->>Orders: POST /api/orders/calculate-total<br/>(Items, AddressId, VoucherIds)
    activate Orders
    Orders->>Identity: gRPC: GetUserAddress(addressId)
    Identity-->>Orders: Địa chỉ chuẩn (WardId, DistrictId)
    
    loop Từng Shop trong giỏ hàng
        Orders->>Shipping: POST /api/shipments/preview-fee (Weight, Dims, Ward)
        Shipping->>GHN: API /fee (Tính phí ship theo cước chuẩn)
        GHN-->>Shipping: Cước vận chuyển từng shop
        Shipping-->>Orders: ShippingFee
    end

    Orders->>Orders: Validate & Phân bổ Voucher (Shop Voucher & Platform Voucher)
    Orders->>Orders: Tính GrandTotal = Tiền hàng + Phí ship - Khuyến mãi
    
    Orders->>Redis: SET checkout_session:{Guid}<br/>(Snapshot đầy đủ dữ liệu, TTL: 15 phút)
    Redis-->>Orders: OK

    Orders-->>Buyer: 200 OK: Trả về CheckoutSessionId & Bảng kê tiền chi tiết
    deactivate Orders
```

---

### 2.2. Giai đoạn 2: Tạo Đơn Hàng & Giữ Tồn Kho Phân Tán (Distributed Placement)
Khi người dùng bấm **"Đặt hàng"**, hệ thống thực hiện Saga phân tán để đảm bảo không bị overselling (bán quá số lượng tồn kho) và tách một đơn hàng mẹ (`Order`) thành nhiều đơn hàng con (`SubOrder`) theo từng Shop.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant Orders as 📦 Orders.Api
    participant Redis as ⚡ Redis Cache
    participant Catalog as 🏷️ Catalog.Api (gRPC)
    participant Cart as 🛒 Cart.Api
    participant Payments as 💳 Payments.Api
    participant RabbitMQ as 📨 RabbitMQ (MassTransit)

    Buyer->>Orders: POST /api/orders/checkout<br/>(CheckoutSessionKey, PaymentProvider: COD/Momo/VNPay)
    activate Orders
    
    Orders->>Redis: GET checkout_session:{Key}
    Redis-->>Orders: Dữ liệu đơn hàng hợp lệ
    
    Note over Orders,Catalog: BƯỚC 1: GIỮ KHO TỒN HÀNG (ATOMIC INVENTORY HOLD)
    Orders->>Catalog: gRPC: ReserveStock(List<VariantId, Quantity>)
    alt Không đủ tồn kho
        Catalog-->>Orders: Result.Failure("Không đủ tồn kho")
        Orders-->>Buyer: 400 BadRequest: Hết hàng
    else Giữ kho thành công
        Catalog-->>Orders: Result.Success()
    end

    Note over Orders: BƯỚC 2: TÁCH SUB-ORDER THEO SHOP & ÁP DỤNG VOUCHER
    Orders->>Orders: Sinh OrderId & SubOrderId bằng Snowflake ID
    Orders->>Orders: Tăng UsageCount cho các Voucher hợp lệ
    
    alt Thanh toán Trực tuyến (MoMo / VNPay)
        Orders->>Payments: POST /api/payments/create (OrderId, GrandTotal)
        Payments-->>Orders: PaymentUrl (URL thanh toán)
    end

    Orders->>Orders: Lưu Order & các SubOrder vào CSDL PostgreSQL (Trạng thái: AwaitingConfirmation)
    
    Note over Orders,RabbitMQ: BƯỚC 3: PHÁT SỰ KIỆN KHỞI TẠO SAGA
    loop Cho mỗi SubOrder
        Orders->>RabbitMQ: Publish: SubOrderCreatedEvent
    end

    Orders->>Cart: ClearCart(CustomerId, SelectedVariants)
    Orders->>Redis: DELETE checkout_session:{Key}

    Orders-->>Buyer: 200 OK: Trả về OrderId + PaymentUrl (nếu online)
    deactivate Orders
```

---

### 2.3. Giai đoạn 3: Thanh Toán Trực Tuyến & IPN Webhook (MoMo / VNPay)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant Gateway as 🏦 Cổng MoMo / VNPay
    participant Payments as 💳 Payments.Api
    participant RabbitMQ as 📨 RabbitMQ
    participant Orders as 📦 Orders.Api

    Buyer->>Gateway: Tiến hành quét mã / chuyển khoản tại trang PaymentUrl
    alt Thanh toán thất bại / Hết hạn (Timeout)
        Gateway-->>Buyer: Thông báo giao dịch không thành công
        Gateway->>Payments: Webhook IPN: Giao dịch thất bại / Hủy
        Payments->>RabbitMQ: Publish: PaymentFailedEvent
        RabbitMQ->>Orders: SubOrderRejectedEvent (Hủy đơn & hoàn lại kho hàng)
    else Thanh toán thành công
        Gateway-->>Buyer: Chuyển hướng về trang Kết quả đặt hàng
        Gateway->>Payments: Webhook IPN: Giao dịch thành công (Signature xác thực)
        activate Payments
        Payments->>Payments: Lưu Transaction, cập nhật PaymentStatus = Success
        Payments->>RabbitMQ: Publish: PaymentCompletedEvent
        deactivate Payments
        RabbitMQ->>Orders: Cập nhật SubOrder: IsOnlinePayment = true, sẵn sàng xử lý
    end
```

---

### 2.4. Giai đoạn 4: Vận Hành Đơn Hàng Phía Người Bán & Tích Hợp GHN (Fulfillment)
Quy trình từ lúc Người bán xác nhận đơn, đóng gói hàng, hệ thống tự động sinh vận đơn GHN, đến khi Shipper lấy hàng và giao tận tay Người mua.

```mermaid
sequenceDiagram
    autonumber
    actor Seller as 🏪 Người Bán (Shop)
    participant Orders as 📦 Orders.Api
    participant Saga as 🔄 SubOrderStateMachine
    participant RabbitMQ as 📨 RabbitMQ
    participant Shipping as 🚚 Shippings.Api
    participant GHN as 🏢 Giao Hàng Nhanh (GHN)
    actor Shipper as 🛵 Shipper GHN
    actor Buyer as 👤 Người Mua

    Note over Seller,Orders: 1. SHOP XÁC NHẬN ĐƠN
    Seller->>Orders: POST /api/orders/seller/sub-orders/{id}/confirm
    Orders->>RabbitMQ: Publish: SubOrderConfirmedEvent
    RabbitMQ->>Saga: When(SubOrderConfirmed)
    Saga->>Saga: Chuyển trạng thái -> Processing
    Saga->>Orders: SubOrderStatusChangedEvent("Processing")

    Note over Seller,Orders: 2. SHOP ĐÓNG GÓI & NHẬP KÍCH THƯỚC
    Seller->>Orders: POST /api/orders/seller/sub-orders/{id}/ready-to-ship<br/>(Weight, Length, Width, Height)
    Orders->>RabbitMQ: Publish: PackageReadyEvent
    RabbitMQ->>Saga: When(SubOrderPackageReady)
    Saga->>RabbitMQ: Publish: CreateShipmentRequest (Địa chỉ Shop -> Địa chỉ Khách)

    Note over RabbitMQ,Shipping: 3. KHỞI TẠO VẬN ĐƠN GHN TỰ ĐỘNG
    RabbitMQ->>Shipping: CreateShipmentConsumer nhận request
    activate Shipping
    Shipping->>GHN: POST /shiip/public-api/v2/shipping-order/create<br/>(Sender: Shop, Recipient: Khách, Items, Weight)
    GHN-->>Shipping: 200 OK: Trả về order_code (VD: GHN987654321)
    Shipping->>Shipping: Lưu Shipment (Status: ReadyToPick, WaybillCode)
    deactivate Shipping

    Note over Shipper,Buyer: 4. LẤY HÀNG & GIAO HÀNG
    Shipper->>Seller: Đến kho Shop lấy hàng
    GHN->>Shipping: Webhook: Đã lấy hàng (Picked)
    Shipping->>RabbitMQ: Publish: SubOrderShippedEvent
    RabbitMQ->>Saga: When(SubOrderShipped) -> Chuyển trạng thái -> Shipping

    Shipper->>Buyer: Giao kiện hàng đến tận nhà
    GHN->>Shipping: Webhook: Giao hàng thành công (Delivered)
    Shipping->>RabbitMQ: Publish: SubOrderDeliveredEvent
    RabbitMQ->>Saga: When(SubOrderDelivered) -> Chuyển trạng thái -> Delivered
    Saga->>Orders: Cập nhật SubOrder -> Delivered (Bắt đầu đếm ngược 7 ngày)
```

---

### 2.5. Giai đoạn 5: Hoàn Tất Đơn & Giải Ngân Vào Ví Shop (Escrow Payout)
Cơ chế ký quỹ bảo vệ người mua: tiền hàng tạm thời do sàn giữ. Sau khi nhận hàng (người mua bấm xác nhận hoặc sau 7 ngày không khiếu nại), hệ thống tự động giải ngân tiền hàng vào ví người bán sau khi trừ phí hoa hồng sàn.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant Orders as 📦 Orders.Api
    participant RabbitMQ as 📨 RabbitMQ
    participant Payments as 💳 Payments.Api
    participant Analytics as 📊 Analytics.Api
    actor Seller as 🏪 Người Bán

    alt Người mua bấm "Đã nhận được hàng" (hoặc Auto-Complete sau 7 ngày)
        Buyer->>Orders: POST /api/orders/customer/sub-orders/{id}/complete
    else Hết 7 ngày kể từ khi Delivered
        Orders->>Orders: Background Job: Tự động hoàn tất
    end

    Orders->>RabbitMQ: Publish: SubOrderCompletedEvent
    
    par Giải ngân ví người bán
        RabbitMQ->>Payments: ReleaseSellerPayoutConsumer
        activate Payments
        Payments->>Payments: NetPayout = GrandTotal - CommissionFee
        Payments->>Payments: Cộng tiền vào Ví Shop (Seller Wallet Balance)
        Payments-->>Seller: Thông báo: Tiền hàng đã về ví!
        deactivate Payments
    and Cập nhật doanh thu thống kê
        RabbitMQ->>Analytics: OrderCompletedAnalyticsConsumer
        Analytics->>Analytics: Tăng CompletedOrderCount & Doanh thu thực tế trong ngày
    end
```

---

## 3. Sơ Đồ Máy Trạng Thái Saga (`SubOrderStateMachine`)
Toàn bộ chu trình vận hành một đơn hàng con (`SubOrder`) được quản lý nghiêm ngặt thông qua **MassTransit State Machine Saga**:

```mermaid
stateDiagram-v2
    [*] --> AwaitingConfirmation: SubOrderCreatedEvent (Đơn mới tạo)

    AwaitingConfirmation --> Processing: SubOrderConfirmedEvent (Shop duyệt đơn)
    AwaitingConfirmation --> Cancelled: SubOrderRejectedEvent (Shop hủy / Hết hàng)

    state Processing {
        [*] --> Packing: Chuẩn bị hàng
        Packing --> ReadyToShip: PackageReadyEvent (Nhập cân nặng/kích thước)
        ReadyToShip --> CreateGHN: Gửi lệnh tạo vận đơn GHN
    }

    Processing --> Shipping: SubOrderShippedEvent (Shipper lấy hàng)
    Processing --> Cancelled: SubOrderRejectedEvent (Hủy trước khi giao)

    Shipping --> Delivered: SubOrderDeliveredEvent (Giao hàng thành công)
    Shipping --> Cancelled: SubOrderRejectedEvent (Giao thất bại / Hoàn gốc)

    Delivered --> Completed: SubOrderCompletedEvent (Buyer xác nhận / Hết 7 ngày)
    Delivered --> Refunded: RefundApprovedEvent (Người bán duyệt Trả hàng/Hoàn tiền)

    Cancelled --> [*]: Giải phóng tồn kho + Hoàn tiền nếu Online
    Completed --> [*]: Giải ngân tiền vào Ví Shop (Net Payout)
    Refunded --> [*]: Hoàn tiền ví Buyer + Tạo vận đơn trả hàng GHN
```

---

## 4. Sơ Đồ Quy Trình Trả Hàng / Hoàn Tiền (Reverse Logistics)
Quy trình khi khách hàng khiếu nại, người bán thẩm định hình ảnh/video bằng chứng, duyệt hoàn trả và hệ thống tự động kích hoạt đơn vận chuyển hàng về kho shop:

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant Orders as 📦 Orders.Api
    actor Seller as 🏪 Người Bán
    participant Payments as 💳 Payments.Api
    participant Shipping as 🚚 Shippings.Api
    participant GHN as 🏢 GHN Logistics
    participant Catalog as 🏷️ Catalog.Api

    Buyer->>Orders: POST /api/orders/refunds<br/>(SubOrderId, Lý do, Mô tả, ProofImages/Videos)
    Orders->>Orders: Tạo RefundRequest (Status: Pending, Hạn duyệt: 3 ngày)
    
    Seller->>Orders: Xem chi tiết yêu cầu & bằng chứng ảnh/video tại RefundRequestsView
    
    alt Trường hợp 1: Người bán TỪ CHỐI
        Seller->>Orders: POST /api/orders/seller/refunds/{id}/reject (Kèm lý do từ chối)
        Orders->>Orders: RefundRequest: Status = SellerRejected
        Orders-->>Buyer: Thông báo: Shop từ chối hoàn tiền
    else Trường hợp 2: Người bán CHẤP THUẬN HOÀN TIỀN
        Seller->>Orders: POST /api/orders/seller/refunds/{id}/approve
        activate Orders
        
        Note over Orders,Payments: Kiểm tra & Khấu trừ Ví Shop -> Hoàn ví Người Mua
        Orders->>Payments: CheckWalletBalance(SellerId, RefundAmount)
        Payments-->>Orders: Số dư hợp lệ
        
        Orders->>Orders: Cập nhật: RefundRequest -> SellerApproved
        Orders->>Orders: Cập nhật: SubOrder -> Refunded
        
        par 1. Hoàn tiền đa phương thức
            Orders->>Payments: Publish: RefundApprovedEvent
            Payments->>Payments: Trừ ví Seller, Cộng tiền hoàn ví Buyer
        and 2. Tạo vận đơn hoàn hàng (Reverse Logistics)
            Orders->>Shipping: Publish: CreateShipmentRequest (IsRefund: true)
            activate Shipping
            Shipping->>GHN: POST /shipping-order/create<br/>(Sender: Khách hàng, Recipient: Kho Shop, Items)
            GHN-->>Shipping: Trả về mã vận đơn hoàn trả (WaybillCode)
            Shipping->>Shipping: Lưu Shipment hoàn trả (ReadyToPick)
            deactivate Shipping
        and 3. Hoàn tồn kho sản phẩm
            Orders->>Catalog: Publish: ReleaseStocksRequest
            Catalog->>Catalog: Cộng lại số lượng tồn kho (Inventory Restock)
        end
        
        Orders-->>Seller: 200 OK: Duyệt hoàn tiền thành công
        deactivate Orders
    end
```

---

## 5. Sơ Đồ Hủy Đơn Hàng & Giao Dịch Bù Trừ (Order Cancellation & Compensation)
> **Bối cảnh**: Người mua bấm "Hủy đơn" khi đơn chưa được Shop gửi đi (trạng thái `AwaitingConfirmation` hoặc `Processing`), hoặc Người bán bấm "Từ chối đơn / Hết hàng" (`SubOrderRejectedEvent`).  
> **Thách thức kiến trúc**: Hệ thống phân tán cần đảm bảo không bị thất thoát tiền và lệch số lượng tồn kho (Eventual Consistency).

```mermaid
sequenceDiagram
    autonumber
    actor Actor as 👤 Người Mua / 🏪 Người Bán
    participant Orders as 📦 Orders.Api
    participant Saga as 🔄 SubOrderStateMachine
    participant RabbitMQ as 📨 RabbitMQ
    participant Payments as 💳 Payments.Api
    participant Catalog as 🏷️ Catalog.Api

    Actor->>Orders: POST /sub-orders/{id}/cancel (Kèm lý do hủy)
    activate Orders
    Orders->>RabbitMQ: Publish: SubOrderRejectedEvent (SubOrderId, Reason)
    deactivate Orders

    RabbitMQ->>Saga: When(SubOrderRejected)
    activate Saga
    Saga->>Saga: Ghi nhận FailureReason & Chuyển trạng thái -> Cancelled

    par 1. Bù trừ hoàn tiền (Nếu đã thanh toán online)
        Saga->>RabbitMQ: Publish: RefundSubOrderBeforeDeliveredRequest
        RabbitMQ->>Payments: Xử lý hoàn 100% tiền đơn hàng
        Payments->>Payments: Cộng tiền vào Ví Buyer (hoặc Refund qua Cổng MoMo/VNPay)
    and 2. Bù trừ hoàn trả tồn kho sản phẩm
        Saga->>RabbitMQ: Publish: ReleaseStocksRequest (VariantItems)
        RabbitMQ->>Catalog: ReleaseStocksConsumer
        Catalog->>Catalog: Cộng lại số lượng tồn kho (Atomic Stock Increment)
    and 3. Bù trừ Voucher đã áp dụng
        Saga->>Orders: Hoàn lại lượt dùng Voucher (Giảm UsageCount)
    end
    deactivate Saga

    Orders-->>Actor: Thông báo: Đơn hàng đã hủy thành công & Tiền/Kho đã hoàn tất!
```
**Chú thích chi tiết**:
- **Ai thao tác**: Khách hàng (đổi ý không muốn mua nữa) hoặc Shop (phát hiện rách hàng, hết tồn kho vật lý).
- **Điều kiện**: Chỉ được hủy khi đơn hàng chưa giao cho Shipper (`CurrentState != Shipping`).
- **Giao dịch bù trừ (Compensating Transactions)**:
  1. *Hoàn tiền*: `Payments.Api` nhận `RefundSubOrderBeforeDeliveredRequest`, tự động trả lại 100% giá trị đơn hàng vào Ví người mua mà không cần shop duyệt thủ công.
  2. *Hoàn kho*: `Catalog.Api` nhận `ReleaseStocksRequest`, lập tức cộng ngược số lượng lại kệ kho.
  3. *Hoàn voucher*: Trừ `UsageCount` của voucher để khách hàng có thể dùng lại mã ưu đãi cho lần mua sau.

---

## 6. Sơ Đồ Giao Hàng Thất Bại & Chuyển Hoàn (Delivery Failure & Return to Sender)
> **Bối cảnh**: Shipper GHN đi giao hàng nhưng khách không nghe máy, sai địa chỉ, hoặc khách từ chối nhận hàng không có lý do sau 3 lần giao.

```mermaid
sequenceDiagram
    autonumber
    actor Shipper as 🛵 Shipper GHN
    participant GHN as 🏢 GHN Logistics
    participant Shipping as 🚚 Shippings.Api
    participant RabbitMQ as 📨 RabbitMQ
    participant Orders as 📦 Orders.Api
    participant Catalog as 🏷️ Catalog.Api
    actor Seller as 🏪 Người Bán

    Shipper->>GHN: Cập nhật: Giao hàng thất bại lần 3 (Khách không nhận)
    GHN->>Shipping: Webhook: delivery_fail (Lý do: Không liên lạc được)
    Shipping->>Shipping: Cập nhật Shipment: Status = ReturningToSender
    
    Shipper->>Seller: Vận chuyển kiện hàng quay ngược về kho của Shop
    Seller->>Orders: Xác nhận: Đã nhận lại kiện hàng chuyển hoàn
    
    Orders->>RabbitMQ: Publish: SubOrderRejectedEvent (Lý do: Giao thất bại hoàn gốc)
    RabbitMQ->>Orders: Cập nhật SubOrder -> Cancelled
    
    par Hoàn lại hàng vào kho Shop
        RabbitMQ->>Catalog: ReleaseStocksRequest (Cộng lại kho)
    and Xử lý tiền cước vận chuyển
        Orders->>Orders: Khấu trừ phí vận chuyển 2 chiều theo chính sách sàn
    end
```
**Chú thích chi tiết**:
- **Ai thao tác**: Shipper GHN & Hệ thống Webhook tự động.
- **Quy trình xử lý**: Hàng hóa không bị mất mà được chuyển hoàn về kho người bán. Khi người bán bấm xác nhận đã nhận lại kiện hàng nguyên vẹn, hệ thống mới chính thức đóng đơn (`Cancelled`) và hoàn trả số lượng vào kho `Catalog.Api`.

---

## 7. Sơ Đồ Đánh Giá Sản Phẩm & Cập Nhật Điểm Uy Tín (Product Review & Rating)
> **Bối cảnh**: Sau khi đơn hàng hoàn tất (`Completed`), khách hàng chấm điểm sao, nhận xét trải nghiệm và tải ảnh chụp thực tế để chia sẻ cho cộng đồng.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant Orders as 📦 Orders.Api
    participant Catalog as 🏷️ Catalog.Api
    participant Recom as 🧠 Recommendations.Api

    Note over Buyer,Orders: ĐIỀU KIỆN: Đơn hàng con phải ở trạng thái Completed
    Buyer->>Orders: GET /sub-orders/{id} -> Kiểm tra Status == Completed
    Buyer->>Catalog: POST /api/catalog/reviews<br/>(ProductId, SubOrderId, Rating: 1-5 Sao, Comment, Ảnh chụp thực tế)
    activate Catalog
    Catalog->>Orders: Xác thực: Khách hàng này đã thực sự mua và hoàn tất đơn chưa?
    Orders-->>Catalog: Hợp lệ (Verified Purchase)

    Catalog->>Catalog: Lưu Review vào CSDL PostgreSQL
    Catalog->>Catalog: Tính toán lại RatingAverage & ReviewCount của Sản phẩm:
    Note over Catalog: RatingAverage = Tổng_Số_Sao / Tổng_Lượt_Đánh_Giá

    Catalog->>Recom: Đồng bộ điểm uy tín mới của sản phẩm
    Note over Recom: Cập nhật trọng số đề xuất:<br/>Sản phẩm điểm cao -> Tự động đưa lên mục For-You & Trending
    Catalog-->>Buyer: 200 OK: Đánh giá thành công!
    deactivate Catalog
```
**Chú thích chi tiết**:
- **Chống Review ảo (Verified Purchase)**: `Catalog.Api` xác thực chéo với `Orders.Api` đảm bảo chỉ tài khoản đã mua và hoàn tất đơn hàng thật mới được để lại đánh giá.
- **Thuật toán Đề xuất**: Điểm trung bình sao (`RatingAverage`) được bắn sang `Recommendations.Api` để quyết định sản phẩm có được hiển thị trên trang chủ mục **"Dành Cho Bạn (For You)"** và **"Xu Hướng 24h"** hay không.

---

## 8. Sơ Đồ Rút Tiền Từ Ví Người Bán (Seller Wallet Withdrawal Flow)
> **Bối cảnh**: Doanh thu sau khi trừ phí sàn tích lũy trong Ví người bán (`Seller Wallet`). Người bán tạo lệnh rút tiền về tài khoản ngân hàng cá nhân (Vietcombank, MB, Techcombank...).

```mermaid
sequenceDiagram
    autonumber
    actor Seller as 🏪 Người Bán
    participant Payments as 💳 Payments.Api
    actor Admin as 🛡️ Quản Trị Viên (Admin)
    participant Banking as 🏦 Cổng Ngân Hàng (VietQR / Napas)

    Seller->>Payments: POST /api/wallet/withdraw<br/>(Số tiền muốn rút, Tên ngân hàng, Số tài khoản, Tên thụ hưởng)
    activate Payments
    
    Payments->>Payments: Kiểm tra Số dư khả dụng (AvailableBalance >= Amount)
    alt Số dư không đủ
        Payments-->>Seller: 400 BadRequest: Số dư khả dụng không đủ!
    else Số dư hợp lệ
        Payments->>Payments: KHÓA TẠM SỐ DƯ (Hold Balance):<br/>AvailableBalance -= Amount<br/>LockedBalance += Amount
        Payments->>Payments: Tạo yêu cầu rút tiền (WithdrawalRequest: Pending)
        Payments-->>Seller: 200 OK: Yêu cầu rút tiền đã được ghi nhận, chờ duyệt!
    end
    deactivate Payments

    Note over Admin,Payments: BƯỚC 2: QUẢN TRỊ VIÊN ĐỐI SOÁT & PHÊ DUYỆT
    Admin->>Payments: GET /api/admin/withdrawals -> Xem xét danh sách yêu cầu
    alt Từ chối (Sai số tài khoản / Tài khoản vi phạm)
        Admin->>Payments: POST /withdrawals/{id}/reject (Lý do từ chối)
        Payments->>Payments: Mở khóa số dư: Hoàn tiền từ LockedBalance về AvailableBalance
        Payments-->>Seller: Thông báo: Lệnh rút tiền bị từ chối!
    else Phê duyệt & Chuyển khoản
        Admin->>Payments: POST /withdrawals/{id}/approve
        Payments->>Banking: Chuyển khoản ngân hàng 24/7 (VietQR / Napas247)
        Banking-->>Payments: Chuyển khoản thành công
        Payments->>Payments: Trừ dứt điểm LockedBalance, Cập nhật Status = Completed
        Payments-->>Seller: Thông báo: Tiền đã được chuyển vào tài khoản ngân hàng!
    end
```
**Chú thích chi tiết**:
- **Cơ chế Khóa số dư (Balance Hold)**: Ngay khi tạo lệnh rút tiền, hệ thống trừ ngay vào `AvailableBalance` và chuyển vào `LockedBalance`. Điều này ngăn chặn Shop tạo 2 lệnh rút cùng một số tiền cùng lúc (Double Spending).
- **Đối soát 2 vòng**: Yêu cầu rút tiền bắt buộc phải qua Admin kiểm tra gian lận (Fraud detection) trước khi giải ngân ra hệ thống ngân hàng thật.

---

## 9. Sơ Đồ Đăng Ký Cửa Hàng & Duyệt Hồ Sơ KYC (Seller Onboarding & KYC Approval)
> **Bối cảnh**: Khách hàng thông thường muốn mở gian hàng kinh doanh trên sàn thương mại điện tử. Hệ thống yêu cầu xác minh danh tính (KYC) để phòng chống lừa đảo.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Người Dùng (Muốn bán hàng)
    participant Sellers as 🏪 Sellers.Api
    participant Shippings as 🚚 Shippings.Api
    actor Admin as 🛡️ Quản Trị Viên (Admin)
    participant Identity as 👤 Identity.Api

    User->>Shippings: GET /api/shippings/provinces, districts, wards
    Shippings-->>User: Danh mục Tỉnh/Huyện/Xã chuẩn của GHN

    User->>Sellers: POST /api/sellers/onboarding<br/>(Tên Shop, Địa chỉ kho lấy hàng GHN, Ảnh CCCD mặt trước & mặt sau)
    activate Sellers
    Sellers->>Sellers: Lưu Seller & SellerKyc (Status: Pending)
    Sellers-->>User: 200 OK: Đã nộp hồ sơ KYC, vui lòng chờ duyệt trong 24h!
    deactivate Sellers

    Note over Admin,Sellers: QUẢN TRỊ VIÊN THẨM ĐỊNH HỒ SƠ
    Admin->>Sellers: GET /api/admin/sellers/kyc-pending -> Xem ảnh CCCD & thông tin kho
    alt Hồ sơ không đạt (Ảnh mờ, thông tin giả mạo)
        Admin->>Sellers: POST /kyc/{id}/reject (Lý do từ chối)
        Sellers-->>User: Thông báo: Hồ sơ bị từ chối, vui lòng chụp lại CCCD rõ nét
    else Hồ sơ đạt chuẩn
        Admin->>Sellers: POST /kyc/{id}/approve
        activate Sellers
        Sellers->>Sellers: Cập nhật: SellerStatus = Active, KycStatus = Approved
        Sellers->>Identity: gRPC: AssignRole(UserId, "Seller")
        Identity-->>Sellers: Cấp quyền Seller thành công
        deactivate Sellers
        Sellers-->>User: Chúc mừng! Bạn đã chính thức trở thành Người bán trên sàn!
    end
```
**Chú thích chi tiết**:
- **Chuẩn hóa Địa chỉ kho ngay từ đầu**: Khi đăng ký Shop, địa chỉ kho lấy hàng bắt buộc phải chọn theo danh mục chuẩn của GHN (`WardId`, `DistrictId`). Điều này đảm bảo khi có đơn hàng, hệ thống có thể lập tức gọi API tính cước và sinh mã vận đơn GHN mà không bao giờ bị lỗi sai địa chỉ.
- **Nâng cấp quyền tự động (RBAC)**: Khi Admin bấm duyệt, `Sellers.Api` giao tiếp qua gRPC với `Identity.Api` để gán thêm quyền `Role = Seller` cho tài khoản người dùng mà không cần người dùng phải đăng ký tài khoản mới.

---

## 10. Sơ Đồ Mua Lại Đơn Hàng Nhanh (Re-order Flow)
> **Bối cảnh**: Người mua muốn mua lại nhanh chóng các sản phẩm từ một đơn hàng đã từng đặt trong quá khứ mà không cần phải tìm kiếm lại từng món trên trang chủ.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 👤 Người Mua
    participant UI as 💻 Giao Diện (React 19)
    participant Orders as 📦 Orders.Api
    participant Catalog as 🏷️ Catalog.Api (gRPC)
    participant Cart as 🛒 Cart.Api (Redis)

    Buyer->>UI: Bấm nút "Mua lại đơn này" tại Lịch sử đơn hàng
    activate UI
    UI->>Orders: GET /api/orders/customer/sub-orders/{id}
    Orders-->>UI: Danh sách sản phẩm: List<ProductId, VariantId, Quantity>

    loop Từng mặt hàng trong đơn cũ
        UI->>Catalog: gRPC: CheckProductAvailability(VariantId)
        alt Sản phẩm hết hàng hoặc ngừng kinh doanh
            Catalog-->>UI: IsAvailable: false
            UI->>UI: Đưa vào danh sách cảnh báo: "Sản phẩm X hiện đã hết hàng"
        else Sản phẩm còn hàng
            Catalog-->>UI: IsAvailable: true, CurrentPrice
            UI->>Cart: POST /api/cart/items (Thêm vào Giỏ hàng Redis)
        end
    end

    alt Không còn mặt hàng nào khả dụng
        UI-->>Buyer: Thông báo: Rất tiếc, các sản phẩm trong đơn cũ hiện đều đã hết hàng!
    else Có ít nhất 1 mặt hàng còn bán
        UI->>UI: Hiển thị Toast thông báo: "Đã thêm các mặt hàng còn hàng vào giỏ!"
        UI-->>Buyer: Tự động chuyển hướng sang trang Giỏ Hàng (/cart) để thanh toán
    end
    deactivate UI
```
**Chú thích chi tiết**:
- **Kiểm tra tồn kho thời gian thực**: Giá cả và tồn kho của sản phẩm có thể đã thay đổi so với thời điểm mua trong quá khứ. Luồng mua lại luôn đối soát với `Catalog.Api` để lấy giá mới nhất và chỉ đưa các sản phẩm còn tồn kho vào giỏ hàng, bảo vệ khách hàng khỏi việc mua phải mặt hàng đã ngừng kinh doanh.

---

## 🛠️ Hướng Dẫn Sử Dụng & Tùy Chỉnh

1. **Xem trực tiếp trên GitHub/GitLab**: File markdown này tự động hiển thị sơ đồ trực quan sắc nét khi xem trên giao diện web của GitHub repository.
2. **Chỉnh sửa online**:
   - Truy cập [https://mermaid.live](https://mermaid.live).
   - Sao chép bất kỳ khối code nào nằm trong cặp dấu ` ```mermaid ... ``` ` ở trên và dán vào khung bên trái.
   - Bạn có thể đổi tên nhãn, thêm các bước nghiệp vụ, đổi màu sắc theo ý muốn.
   - Bấm **Actions -> Download PNG / SVG** để chèn vào báo cáo đồ án hoặc slide thuyết trình.
3. **Nhúng vào Website của bạn**:
   - Sử dụng thư viện JavaScript `mermaid.js`:
     ```html
     <script type="module">
       import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
       mermaid.initialize({ startOnLoad: true, theme: 'default' });
     </script>
     <div class="mermaid">
       <!-- Dán code Mermaid vào đây -->
     </div>
     ```
