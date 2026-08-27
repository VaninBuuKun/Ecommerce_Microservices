# Ecommerce Microservices — Project Overview & Reference

> **Cập nhật:** 2026-08-15
> **Root:** `d:\Projects\Microservices`

---

## 1. Kiến trúc tổng thể

### Stack
| Layer | Công nghệ |
|---|---|
| Backend | .NET 8, ASP.NET Core, DDD + CQRS (MediatR) |
| ORM | EF Core 8 |
| Auth | Duende IdentityServer + JWT |
| Messaging | MassTransit + RabbitMQ |
| Inter-service sync | gRPC |
| Cache | Redis (giỏ hàng + CheckoutSession) |
| Gateway | YARP Reverse Proxy |
| Frontend | React 19, TypeScript, Vite, TanStack Query, Zustand |

### Database mỗi service
| Service | DB |
|---|---|
| Identity | PostgreSQL |
| Catalog | MySQL |
| Cart | Redis |
| Orders | PostgreSQL |
| Payments | PostgreSQL |
| Sellers | PostgreSQL |
| Shippings | PostgreSQL |
| Notifications | PostgreSQL |

---

## 2. Danh sách 8 Microservices

| Service | Port      | Vai trò |
|---|-----------|---|
| **Identity** | 5027/5028 | IdentityServer, JWT, User/Address, Wallet |
| **Catalog** | 5001/5002 | Products, Options, Variants, Reviews, Categories |
| **Cart** | 5004/5005 | Redis-based, session-less; gRPC server |
| **Orders** | 5007/5008 | Order → SubOrder (per-shop) → Item; Voucher, Refund |
| **Payments** | 5052/5053 | MoMo, VNPay, COD; Wallet; Revenue |
| **Sellers** | 5042/5043 | Shop, Profile, Coupon (seller-side) |
| **Shippings** | 5070/5071 | Shipment, GHN integration; Location lookup |
| **Notifications** | 5080/5081 | SignalR, event consumers, alerts |

---

## 3. Domain Models quan trọng

### Order Service
```
Order (AggregateRoot<Guid>)
  ├── CustomerId, ShippingAddress, RecipientName/Phone/WardId
  ├── SubTotal, ShippingFee, TotalDiscount, GrandTotal
  ├── IsOnlinePayment
  └── SubOrder[] (per ShopId)
        ├── ShopId, CustomerId
        ├── SubTotal, ShippingFee, SellerDiscount, PlatformDiscount, GrandTotal
        ├── ShopVoucherId?, PlatformVoucherId?   ← rollback support
        ├── Status (SubOrderStatus state machine)
        └── SubOrderItem[] (VariantId, ProductName, VariantName, UnitPrice, Qty)

Voucher
  ├── Code, Name, DiscountType (0=Percent, 1=Flat), DiscountValue
  ├── Scope (0=Platform, 1=Shop), ShopId?
  ├── MinOrderValue, MaxDiscountAmount?
  ├── MaxUsageCount, [ConcurrencyCheck] UsageCount, MaxUsagePerUser
  └── StartDate, EndDate, IsActive

VoucherUsage
  ├── VoucherId, UserId, OrderId, SubOrderId
  ├── DiscountAmount, UsedAt
```

### Catalog Service
```
Product (AggregateRoot<Guid>)
  ├── ShopId, Name, Description, Status
  ├── ProductOption[] → ProductOptionValue[]
  └── ProductVariant[] (Sku, Price, AvailableStocks)

ProductReview
  ├── ProductId, CustomerId, Rating (1-5), Comment
  ├── List<string> Media  ← stored as JSON
  └── CustomerName, CustomerAvatarUrl  ← loaded via gRPC Identity
```

### Sellers Service
```
Shop (EntityTrackingBase<long>)
  ├── OwnerUserId, Name, Description, LogoUrl?
  ├── PickUpAddress (VO): Province/District/Ward, AddressLine, IDs
  └── Status: Active | Suspended | Banned
```

---

## 4. Voucher System (đã hoàn thiện)

### Flow áp dụng
1. User chọn voucher ở Checkout → lưu code vào `CheckoutSession` (Redis, TTL 30ph)
2. `CalOrderGrandTotal` handler validate + tính giảm giá → trả về preview
3. `CreateOrder` handler:
    - Re-validate voucher
    - `TryIncrementUsagesAsync(allVoucherIds)` — **batch atomic** (1 SQL, dùng `ConcurrencyCheck`)
    - Nếu fail → compensate stock
    - Ghi `VoucherUsage` records (batch)
    - Nếu payment/save fail → `DecrementUsagesAsync` (compensate voucher)
4. Hủy đơn (`CancelOrder`) → `DecrementUsagesAsync` cho các VoucherId trong SubOrder

### Quy tắc nghiệp vụ
- Platform voucher (Scope=0): Sàn chịu chi phí, **không ảnh hưởng doanh thu người bán**
- Shop voucher (Scope=1): Người bán chịu chi phí giảm giá
- Mỗi SubOrder chỉ 1 shop voucher + 1 platform voucher
- Platform discount phân bổ theo tỉ lệ subtotal của từng shop

---

## 5. Event Flow chính

### Tạo đơn hàng
```
Client → Gateway → OrderController.CreateOrder
  → gRPC Cart.GetCart
  → gRPC Product.ReserveStock
  → Validate + Increment Voucher
  → Save Order + SubOrders + VoucherUsage
  → gRPC Payment.CreatePayment (nếu online)
  → Publish SubOrderCreatedEvent → Shipping.CreateShipmentConsumer
  → Publish OrderConfirmedEvent → Cart.RemoveItemsConsumer
  → Clear Redis CheckoutSession
```

### Payment Callback
```
MoMo/VNPay Webhook → PaymentController
  → Verify signature
  → Update Payment status
  → Publish PaymentSucceededEvent / PaymentFailedEvent
  → Order consumer → SubOrder: AwaitingPayment → AwaitingConfirmation
```

### SubOrder Hoàn thành (Seller Revenue)
```
CompleteOrder command → SubOrderCompletedEvent
  → Payment.SellerRevenueConsumer
      → gRPC Seller.GetShopShippingInfo → OwnerUserId
      → Tìm / tạo Wallet của Owner
      → wallet.Balance += TotalAmount (trừ PlatformDiscount)  ← [TODO: chưa trừ discount]
      → Tạo WalletTransaction (Credit, SellerRevenue)
```

---

## 6. SubOrder Status State Machine

```
AwaitingPayment
    ↓ PaymentSucceeded
AwaitingConfirmation
    ↓ SellerConfirm
Processing
    ↓ SellerPackageReady
PackageReady
    ↓ Shipped (GHN callback)
Shipping
    ↓ Delivered
Delivered
    ↓ Timeout 7 ngày hoặc User xác nhận
Completed → [SellerRevenueConsumer cộng tiền]
    ↓ Hoặc User tạo refund
Returning → Refunded
```

---

## 7. Frontend Modules

| Module | Pages / Components đã có |
|---|---|
| `auth` | LoginPage, RegisterPage, UserProfilePage, **UserProfilePublicPage** |
| `catalog` | ProductDetailPage (gallery, options, price, reviews), ProductReviewsSection |
| `cart` | CartPage |
| `order` | CheckoutPage, PlatformVoucherModal, ShopVoucherModal, OrderItemsList |
| `seller` | SelectShopPage, RegisterShopPage, SellerDashboard, ShopSettingsPage, CouponsView, **ShopProfilePublicPage** |
| `landing` | LandingPage |
| `admin` | AdminDashboard |

### Routes đã đăng ký
```
/ → LandingPage
/cart → CartPage
/checkout → CheckoutPage
/products/:id → ProductDetailPage
/profile → UserProfilePage
/orders → UserProfilePage (orders tab)
/users/:userId → UserProfilePublicPage  ← MỚI
/shops/:shopId → ShopProfilePublicPage  ← MỚI
/seller → SelectShopPage
/seller/register → RegisterShopPage
/seller/:shopId/dashboard → SellerDashboard
```

---

## 8. Backend Build Notes

- **File solution gốc:** `d:\Projects\Microservices\Microservices.sln`
- Luôn build từ solution: `dotnet build Microservices.sln` để đảm bảo BuildingBlocks được build đúng thứ tự
- Build từng project riêng với `--no-incremental` sẽ báo lỗi CS0006 thiếu DLL reference nếu BuildingBlocks chưa build

### Lỗi hiện tại (chưa fix)
| File | Lỗi | Nguyên nhân |
|---|---|---|
| `ShopController.cs` | CS0426 | Dùng fully-qualified namespace làm type khi dispatch query |
| `GetPublicShopsByOwnerIdQuery.cs` | CS0117 | `ShopStatus.Active` đúng nhưng phải import namespace đúng |

**Fix:** Thêm `using` directives vào `ShopController.cs` thay vì dùng fully-qualified name.
