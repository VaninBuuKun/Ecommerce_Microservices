# 03. End-to-End Checkout & Order Lifecycle Flowchart

This document details the complete transaction lifecycle for Order Checkout, Shipping Fee Calculation, Payment Gateways (Momo/VNPay/COD), GHN Shipment creation, and Seller Revenue Settlement using **Mermaid.js**.

> 💡 **Tip**: You can copy-paste any Mermaid block below into [Mermaid Live Editor](https://mermaid.live/) or view directly in GitHub / VS Code / Antigravity IDE to export as PNG/SVG or customize the diagram!

---

## 📊 1. Detailed System Checkout & Order Flowchart

```mermaid
flowchart TD
    %% Styling Node Definitions
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef orderSvc fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef grpcSvc fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef paySvc fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef busSvc fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff;

    subgraph CLIENT ["📱 Client Layer (React 19 Frontend)"]
        A[User opens Checkout Page]:::client
        B[Select Shipping Address & Vouchers]:::client
        C[Click 'Place Order']:::client
    end

    subgraph ORDER_CALC ["🛒 Step 1: Pre-Checkout Calculation"]
        A -->|1. Request Calculate| D[Orders.Api: CalOrderGrandTotal]:::orderSvc
        D -->|2. gRPC Get Selected Items| E[Cart.Api: CartGrpcServer]:::grpcSvc
        D -->|3. gRPC Get Shop PickUp Addresses| F[Sellers.Api: SellerGrpcServer]:::grpcSvc
        D -->|4. gRPC Calculate Shipping Fee| G[Shippings.Api: ShippingGrpcServer]:::grpcSvc
        G -->|External API Call| H[GHN Shipping Service API]
        D -->|5. Return Granular Fees & Total| A
    end

    subgraph ORDER_EXEC ["📦 Step 2: Create Order & Stock Reservation"]
        C -->|6. POST /api/orders| I[Orders.Api: CreateOrderCommand]:::orderSvc
        I -->|7. gRPC Reserve Stock| J[Catalog.Api: ProductGrpcServer]:::grpcSvc
        J -- Stock Available? --> K{Check Stock}
        K -- Insufficient --> L[Return OUT_OF_STOCK Error]:::busSvc
        K -- Stock Locked --> M[Create Parent Order & SubOrders per Shop]:::orderSvc
        M -->|Clear Cart Items| N[Cart.Api: Remove Selected Items]:::grpcSvc
    end

    subgraph PAYMENT_FLOW ["💳 Step 3: Payment Processing"]
        M -->|Check Payment Method| O{Payment Type}
        
        %% COD Flow
        O -- COD --> P[Set SubOrder Status: AwaitingConfirmation]:::orderSvc
        P --> Q[Publish SubOrderCreatedEvent]:::busSvc

        %% Online Payment Flow (Momo / VNPay)
        O -- Momo / VNPay --> R[Orders.Api -> gRPC Payment.Api]:::grpcSvc
        R --> S[Create Payment Transaction & PayUrl]:::paySvc
        S -->|Return PayUrl| A
        A -->|User scans QR / Pays| T[Payment Gateway: Momo / VNPay Sandbox]
        T -->|Callback / IPN Webhook| U[Payments.Api: Webhook Controller]:::paySvc
        U -->|Publish PaymentSucceededEvent| V[RabbitMQ MassTransit Bus]:::busSvc
        V -->|Consumer Handles Event| W[Orders.Api: Update SubOrder Status -> AwaitingConfirmation]:::orderSvc
        W --> Q
    end

    subgraph FULFILLMENT ["🚚 Step 4: Fulfillment & Shipment"]
        Q --> X[Seller Confirms & Packages Order]:::orderSvc
        X -->|Status: PackageReady| Y[Publish PackageReadyEvent]:::busSvc
        Y -->|MassTransit Consumer| Z[Shippings.Api: CreateShipmentConsumer]:::grpcSvc
        Z -->|Create Waybill| H
        H -->|Webhook: Status = Delivered| AA[Shippings.Api: WebhooksController]:::grpcSvc
        AA -->|Publish ShipmentDeliveredEvent| V
        V -->|Consumer Handles Event| AB[Orders.Api: SubOrder Status -> Delivered]:::orderSvc
    end

    subgraph SETTLEMENT ["💰 Step 5: Revenue Settlement"]
        AB -->|Publish SellerRevenueCreditEvent| V
        V -->|Consumer Handles Event| AC[Payments.Api: SellerRevenueConsumer]:::paySvc
        AC -->|Add Credit Transaction| AD[Add Balance to Seller Wallet]:::paySvc
        AD --> AE[Completed Transaction Lifecycle]:::orderSvc
    end
```

---

## 🔄 2. State Machine Transition Diagram (SubOrder Status)

```mermaid
stateDiagram-v2
    [*] --> AwaitingPayment: Online Payment (Momo / VNPay)
    [*] --> AwaitingConfirmation: COD Payment

    AwaitingPayment --> AwaitingConfirmation: PaymentSucceededEvent (Webhook)
    AwaitingPayment --> Cancelled: PaymentFailed / Timeout

    AwaitingConfirmation --> Processing: Seller Confirms Order
    AwaitingConfirmation --> Cancelled: Seller Rejects Order / Customer Cancels

    Processing --> PackageReady: Seller Packages Order & Inputs Specs
    PackageReady --> Shipping: GHN Picked Up Package (Waybill Active)

    Shipping --> Delivered: GHN Webhook (Status = Delivered)
    Shipping --> Refunded: Delivery Failed / Return Shipment

    Delivered --> Completed: Customer Confirms Receipt / Auto 7-Day Auto-Complete
    Delivered --> RefundRequest: Customer Requests Refund

    RefundRequest --> Refunded: Seller Approves Refund
    RefundRequest --> Delivered: Seller Rejects Refund / Dispute Closed

    Completed --> [*]: Seller Revenue Credited to Wallet
    Cancelled --> [*]: Stock Released (ReleaseVariantStocks)
    Refunded --> [*]: Money Refunded to Customer Wallet
```

---

## 📑 3. Step-by-Step Sequence Summary

| Step | Action | Protocol / Technology | Component Involved |
| :--- | :--- | :--- | :--- |
| **1** | Calculate Grand Total | gRPC | `Orders.Api` ➔ `Cart.Api`, `Sellers.Api`, `Shippings.Api` (GHN API) |
| **2** | Reserve Stock | gRPC | `Orders.Api` ➔ `Catalog.Api` (`ReserveVariantStocks`) |
| **3** | Create Order & SubOrders | SQL Transaction | `Orders.Api` (Splits 1 Order into N SubOrders by `ShopId`) |
| **4** | Initiate Online Payment | REST / gRPC | `Orders.Api` ➔ `Payments.Api` (Momo / VNPay PayUrl) |
| **5** | Payment Webhook Callback | HTTP Webhook | Momo/VNPay ➔ `Payments.Api` ➔ MassTransit `PaymentSucceededEvent` |
| **6** | Confirm & Package Ready | CQRS Command | `Orders.Api` ➔ Seller confirms order & sets `PackageReady` |
| **7** | Create GHN Shipment | Event Consumer | MassTransit `CreateShipmentConsumer` ➔ `Shippings.Api` ➔ GHN API |
| **8** | Delivery Webhook | HTTP Webhook | GHN API ➔ `Shippings.Api` ➔ MassTransit `ShipmentDeliveredEvent` |
| **9** | Revenue Settlement | Event Consumer | `Orders.Api` ➔ MassTransit `SellerRevenueCreditEvent` ➔ `Payments.Api` Wallet |
