# 📋 Quy Chuẩn Đặt Tên Git Commit (Git Commit Conventions)

> **Dự án**: Multi-Vendor Ecommerce Microservices Platform  
> **Phiên bản chuẩn**: Conventional Commits v1.0.0  
> **Áp dụng cho**: Toàn bộ Backend (.NET 9 Microservices), Frontend (React 19 Web), Gateway, BuildingBlocks & DevOps.

---

## 🎯 1. Mục Đích & Ý Nghĩa

Việc chuẩn hóa commit message mang lại những lợi ích cốt lõi cho dự án:
- **Lịch sử Git rõ ràng, nhất quán**: Dễ dàng theo dõi tiến độ phát triển và ngữ cảnh thay đổi mã nguồn.
- **Tự động hóa phát hành (Automated Releases)**: Cho phép công cụ CI/CD tự động phân loại phiên bản ([Semantic Versioning](https://semver.org/)) và sinh **CHANGELOG** tự động (`feat` $\rightarrow$ MINOR, `fix` $\rightarrow$ PATCH, `BREAKING CHANGE` $\rightarrow$ MAJOR).
- **Hỗ trợ Code Review & Debugging**: Giúp team reviewer hiểu ngay ý định của lập trình viên; tăng tốc độ truy vết lỗi với `git log`, `git blame` và `git bisect`.
- **Tách biệt ranh giới Microservices**: Với cấu trúc Monorepo / Multi-service, `scope` giúp xác định tức thì thay đổi thuộc service hay ứng dụng nào.

---

## 📐 2. Cấu Trúc Chuẩn (Commit Message Format)

Mỗi commit message phải tuân theo cấu trúc 3 phần:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 2.1. Cấu trúc tổng thể
- **Header** (Bắt buộc): Gồm `<type>`, `(<scope>)` và `<subject>`. Tối đa **72 ký tự** (khuyến nghị $\le$ 50 ký tự).
- **Body** (Tùy chọn nhưng khuyến khích khi có logic phức tạp): Ngăn cách với header bằng 1 dòng trống. Trình bày chi tiết lý do thay đổi (*Why*) và điểm khác biệt (*What changed*). Độ dài mỗi dòng không quá **72 ký tự**.
- **Footer** (Tùy chọn): Ngăn cách với body bằng 1 dòng trống. Dùng để khai báo **BREAKING CHANGE** hoặc liên kết Task/Issue/PR (ví dụ: `Closes #123`, `Refs #456`).

---

## 🏷️ 3. Danh Sách Commit Types Chuẩn

| Type | Ý nghĩa | Khi nào sử dụng? | SemVer Impact |
| :--- | :--- | :--- | :---: |
| **`feat`** | Tính năng mới (Feature) | Bổ sung endpoint mới, thêm MediatR command/query, tạo UI component, flow thanh toán mới... | **MINOR** |
| **`fix`** | Sửa lỗi (Bug fix) | Khắc phục lỗi logic backend, sửa bug UI, vá lỗi tính sai phí ship, token refresh loop... | **PATCH** |
| **`refactor`** | Tái cấu trúc mã nguồn | Tái cấu trúc code mà **không** thay đổi tính năng bên ngoài hay sửa bug (tách service, đổi tên class, gom logic CQRS...) | Không đổi |
| **`perf`** | Tối ưu hiệu năng (Performance) | Tối ưu query SQL, gộp câu lệnh EF Core, bổ sung Redis cache, tối ưu bundle size, lazy load images... | **PATCH** |
| **`style`** | Định dạng giao diện / mã nguồn | Sửa spacing, format code, căn lề Tailwind, chuẩn hóa font/badge/color mà không đổi logic | Không đổi |
| **`docs`** | Cập nhật tài liệu | Sửa file `readme.md`, viết tài liệu Swagger, cập nhật thư mục `docs/`, comment code giải thích kiến trúc | Không đổi |
| **`test`** | Kiểm thử (Testing) | Bổ sung Unit Test (xUnit/FluentAssertions), integration test, mock data handler | Không đổi |
| **`chore`** | Bảo trì & Cấu hình phụ | Thay đổi file `.gitignore`, dọn dẹp file rác, nâng cấp script tiện ích, cấu hình IDE/linter | Không đổi |
| **`build`** | Hệ thống Build & Dependencies | Cập nhật file `.csproj`, package NuGet, `package.json`, Vite config, MSBuild targets | Không đổi |
| **`ci`** | Tích hợp & Triển khai liên tục | Thay đổi cấu hình GitHub Actions workflows, Dockerfile, docker-compose, script deploy | Không đổi |
| **`revert`** | Hoàn tác commit | Khôi phục code từ một commit trước đó (`git revert`) | Phụ thuộc |

---

## 🧭 4. Danh Sách Scopes Cho Dự Án

Trong dự án **Ecommerce Microservices**, `scope` đóng vai trò định danh phân hệ hoặc dịch vụ bị tác động. Hãy sử dụng danh sách scope chuẩn dưới đây:

### 4.1. Backend Microservices
| Scope | Phân hệ tương ứng | Mô tả |
| :--- | :--- | :--- |
| `catalog` | `Catalog.Api` (Port 5001/5002) | Sản phẩm, biến thể (SKU), danh mục, đánh giá & review, tồn kho |
| `cart` | `Cart.Api` (Port 5004/5005) | Giỏ hàng, lưu trữ Redis state, shop grouping |
| `orders` | `Orders.Api` (Port 5007/5008) | Đơn hàng, SubOrder, phí hoa hồng, voucher, refund saga |
| `identity` | `Identity.Api` (Port 5027/5028) | Đăng ký, đăng nhập, JWT, OAuth2/OIDC, phân quyền, địa chỉ user |
| `sellers` | `Sellers.Api` (Port 5042/5043) | KYC người bán, duyệt hồ sơ shop, hồ sơ cửa hàng, theo dõi shop (followers) |
| `payments` | `Payments.Api` (Port 5052/5053) | Cổng thanh toán (VNPay, MoMo, COD), ví người bán (Seller Wallet), rút tiền |
| `shippings` | `Shippings.Api` (Port 5070/5071) | Tích hợp GHN (Giao Hàng Nhanh), tính cước, đồng bộ địa chỉ hành chính |
| `notifications` | `Notifications.Api` (Port 5080/5081) | Gửi email SMTP, realtime SignalR alerts, thông báo đẩy |
| `recommendations` | `Recommendations.Api` (Port 5090/5091) | Gợi ý sản phẩm thông minh, content-based filtering, tracking lượt xem |
| `analytics` | `Analytics.Api` (Port 5095/5096) | Thống kê doanh thu GMV sàn, doanh thu shop, biểu đồ báo cáo timeline |
| `gateway` | `ApiGateway` (YARP) | Reverse proxy, định tuyến route, CORS, rate limiting |
| `buildingblocks` | `BuildingBlocks.*` | Grpc shared protos, EventBus (MassTransit), Logging, Common handlers |

### 4.2. Frontend Web (React 19 - ACO Architecture)
| Scope | Khu vực tương ứng | Mô tả |
| :--- | :--- | :--- |
| `customer-ui` | `src/apps/customer/` | Giao diện sàn khách hàng: Trang chủ, Chi tiết sản phẩm, Giỏ hàng, Checkout, Profile |
| `seller-ui` | `src/apps/seller/` | Giao diện Seller Center: Quản lý hàng, Đơn hàng, Đánh giá, Followers, Báo cáo Doanh thu |
| `admin-ui` | `src/apps/admin/` | Giao diện Quản trị: Duyệt KYC, Quản lý Shop, Quản lý User, Cấu hình Hoa hồng, Thống kê |
| `auth-ui` | `src/apps/auth/` | Form Đăng nhập, Đăng ký, Quên mật khẩu, Xác thực OTP, Auth Guards |
| `shared-ui` | `src/shared/` | Component dùng chung: Modal, Header, Footer, Table, Form inputs, Confirm Dialogs |
| `domain-[name]` | `src/domains/[name]/` | Logic riêng theo domain (VD: `domain-cart`, `domain-order`, `domain-wallet`) |

### 4.3. Hạ Tầng & Cơ Sở Dữ Liệu
| Scope | Mô tả |
| :--- | :--- |
| `db` | Entity Framework Core migrations, seed data, script SQL, index |
| `docker` | Dockerfile, docker-compose.yaml, cấu hình container môi trường dev/prod |
| `telemetry` | OpenTelemetry, Jaeger/Tempo tracing, Prometheus metrics |
| `rabbitmq` | Cấu hình Message Broker, exchanges, queues, dead-letter |

### 4.4. Tài Liệu & Cấu Hình
| Scope | Mô tả |
| :--- | :--- |
| `docs` | Tài liệu kiến trúc, hướng dẫn triển khai, tài liệu API |
| `readme` | Cập nhật file README.md chính |
| `config` | Cấu hình appsettings skeleton, biến môi trường, launchSettings |

---

## ✍️ 5. Bộ Quy Tắc Viết Subject (Header Rules)

1. **Ngôn ngữ**: Khuyến khích sử dụng **Tiếng Anh** ngắn gọn, chuẩn quốc tế (hoặc **Tiếng Việt không dấu / có dấu** rõ ràng, nhất quán trong cùng một PR).
2. **Thể mệnh lệnh (Imperative Mood)**:
   - ✅ Dùng động từ nguyên mẫu: `add`, `update`, `fix`, `refactor`, `remove`, `optimize`, `implement`, `support`
   - ❌ **KHÔNG** dùng dạng quá khứ hoặc danh từ hóa: `added`, `fixed`, `fixing`, `updates`, `implements`
3. **Chữ thường (Lowercase)**:
   - Bắt đầu subject bằng chữ viết thường: `feat(orders): add platform commission snapshot`
   - Ngoại lệ: Cho phép viết hoa các danh từ riêng, thuật ngữ kỹ thuật, tên chuẩn (ví dụ: `JWT`, `gRPC`, `EF Core`, `PostgreSQL`, `GHN`, `MoMo`, `VNPay`, `UI`, `API`, `Saga`).
4. **Không dấu chấm câu kết thúc**:
   - ❌ `fix(cart): resolve item count mismatch.`
   - ✅ `fix(cart): resolve item count mismatch`
5. **Quy tắc độ dài 50/72**:
   - Header $\le$ 50 ký tự (tối đa không quá 72 ký tự).
   - Ngắn gọn, súc tích, phản ánh đúng trọng tâm thay đổi.

---

## 💥 6. Quy Tắc Breaking Changes & Footers

Khi có thay đổi làm **phá vỡ tính tương thích ngược** (Breaking Change) của API, gRPC proto, hoặc Database schema:

### Cách 1: Sử dụng dấu `!` ngay sau Type/Scope
```text
feat(orders)!: change create order payload format to support multi-shop checkout
```

### Cách 2: Sử dụng `BREAKING CHANGE:` trong Footer
```text
refactor(payments): migrate vnpay query api to version 2.1

BREAKING CHANGE: The callback response structure has changed. Legacy clients must update their IPN listeners.
```

### Liên kết Issue / Pull Request trong Footer:
```text
feat(sellers): implement follow and unfollow shop api

Closes #42
Refs #38
```

---

## 💡 7. Ví Dụ Thực Tế Cho Dự Án

### 7.1. Backend Microservices (.NET 9 CQRS & gRPC)
```text
feat(orders): add platform commission snapshot to suborder entity
- Add CommissionRate and CommissionFee fields to SubOrder domain model
- Calculate commission snapshot in CreateOrderCommandHandler
- Include commission details in SubOrderCompletedEvent
```

```text
perf(analytics): optimize daily revenue queries into single conditional group-by
- Replace 6 separate SumAsync calls with 1 GroupBy(_ => 1) in AdminAnalyticsService
- Reduce database network round-trips from 7 to 2
```

```text
fix(payments): prevent duplicate wallet credit on webhook retry
- Add idempotency check on TransactionId before crediting seller wallet
- Return HTTP 200 immediately for already processed IPN calls
```

```text
refactor(shippings): decouple ghn client interface into shared building blocks
```

### 7.2. Database & EF Core Migrations
```text
chore(db): add migration for shop foreign key constraint in followed shops

- Generate AddShopForeignKeyToFollowedShop migration for SellerDbContext
- Establish cascade delete and foreign key index on ShopId
```

### 7.3. Frontend Web (React 19 + Tailwind CSS v4)
```text
feat(seller-ui): implement cubic bezier spline revenue chart
- Add interactive spline curve SVG with hover tooltip and glowing nodes
- Support date filtering presets: today, 3-days, weekly, and monthly
```

```text
fix(auth-ui): prevent session clear on temporary network reboot
- Check for HTTP 401 specifically before clearing user tokens
- Maintain user session when network error occurs during server restart
```

```text
style(admin-ui): standardize header typography and table border colors
- Apply text-4 font-black uppercase tracking-wider to all 14 admin view titles
- Unify table header styles with bg-brand-light-soft/50 font-bold text-xs
```

```text
perf(customer-ui): add lazy loading strategy for recommendation feed
```

---

## 🚫 8. Bảng Đối Chiếu: Sai (Bad) vs Đúng (Good)

| ❌ Không Đúng Chuẩn (Bad) | ✅ Chuẩn Xác (Good) | Giải Thích |
| :--- | :--- | :--- |
| `update code` | `refactor(orders): streamline order status transition logic` | Thiếu type, thiếu scope, nội dung quá mơ hồ |
| `fix bug` | `fix(cart): resolve quantity decrement below minimum limit` | Không rõ bug gì, ở đâu, tại sao sửa |
| `feat: added Chat UI` | `feat(seller-ui): add realtime chat drawer to sidebar` | Dùng thì quá khứ (`added`), chữ hoa không cần thiết |
| `fix: webhook shipping, minimize shipment status, product review` | Tách thành 3 commit riêng biệt hoặc: <br>`fix(shippings): handle webhook status update and review sync` | Gom quá nhiều thay đổi không liên quan vào 1 commit |
| `WIP` hoặc `save` | `feat(payments): implement momo qr code generation (WIP)` | Tránh commit mơ hồ, luôn nêu rõ đang làm phần nào |
| `style: change css.` | `style(shared-ui): adjust button hover state and focus outline` | Bỏ dấu chấm cuối dòng, mô tả rõ thay đổi UI |

---

## 🌿 9. Quy Chuẩn Đặt Tên Git Branch (Kết Hợp)

Để quy trình làm việc chuyên nghiệp và liền mạch, hãy đặt tên branch tương thích với tiền tố commit type:

| Cú pháp Branch | Ví dụ thực tế | Mô tả |
| :--- | :--- | :--- |
| `feature/<tên-tính-năng>` | `feature/seller-analytics-dashboard` | Phát triển tính năng mới |
| `feat/<tên-tính-năng>` | `feat/commission-snapshot` | Tương đương `feature/` |
| `fix/<tên-lỗi>` | `fix/token-refresh-loop` | Sửa lỗi từ issue / bug report |
| `hotfix/<tên-sự-cố>` | `hotfix/vnpay-signature-mismatch` | Sửa lỗi khẩn cấp trực tiếp trên production |
| `refactor/<tên-công-việc>` | `refactor/grpc-adapter-layers` | Tái cấu trúc kiến trúc |
| `perf/<tên-nội-dung>` | `perf/analytics-single-query` | Tối ưu hóa hiệu năng |
| `docs/<tên-tài-liệu>` | `docs/commit-conventions` | Viết hoặc cập nhật tài liệu |

---

## 🛡️ 10. Tích Hợp Git Hook Kiểm Tra Tự Động (Tùy Chọn)

Bạn có thể kích hoạt Git Hook `commit-msg` để máy tính tự động từ chối các commit không đúng chuẩn bằng cách chạy lệnh sau tại thư mục gốc của repository:

```bash
cat << 'EOF' > .git/hooks/commit-msg
#!/bin/bash
# Validate Conventional Commit format
commit_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?!?: .+$'

commit_msg=$(head -n 1 "$1")

if [[ "$commit_msg" =~ ^Merge ]] || [[ "$commit_msg" =~ ^Revert ]]; then
    exit 0
fi

if ! [[ "$commit_msg" =~ $commit_regex ]]; then
    echo -e "\n\033[31m❌ [LỖI COMMIT] Commit message không đúng quy chuẩn!\033[0m"
    echo -e "\033[33mCú pháp chuẩn:\033[0m <type>(<scope>): <subject>"
    echo -e "\033[36mVí dụ:\033[0m feat(orders): add platform commission snapshot to suborder"
    echo -e "Xem chi tiết hướng dẫn tại: \033[34mdocs/COMMIT_CONVENTION.md\033[0m\n"
    exit 1
fi
EOF

chmod +x .git/hooks/commit-msg
```

---

## 📌 11. Tóm Tắt Nhanh (Cheat Sheet)

```text
       type        scope                  subject
        │            │                       │
     ┌──┴──┐      ┌──┴──┐        ┌───────────┴─────────────┐
     feat(orders): implement cancel order refund workflow
     │
     └───► Chữ thường, không chấm ở cuối, động từ nguyên mẫu (add, fix, update...)
```
