# 🛒 BUU STORE - Frontend Client Application

BUU STORE là giao diện ứng dụng thương mại điện tử hiện đại (marketplace). Dự án được phát triển bằng React, TypeScript, và Tailwind CSS v4, kết nối đồng bộ với hệ thống Backend Microservices thông qua API Gateway.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (Thiết kế phẳng tối giản, tối ưu giao diện theo tone màu Emerald đặc trưng)
- **State Management**: Zustand (Auth Store quản lý phiên đăng nhập)
- **Forms & Validation**: React Hook Form + Zod
- **API Communication**: Axios (Tích hợp interceptor hỗ trợ credentials & cơ chế tự động refresh token)

---

## 📂 Cấu Trúc Mã Nguồn (Directory Structure)

Dự án được tổ chức theo mô hình **Feature-based**, giúp dễ dàng mở rộng và bảo trì độc lập:

```text
frontend-web/
├── docs/
│   └── design.md           # Tài liệu đặc tả Design System & mã màu chủ đạo
├── src/
│   ├── App.tsx             # Thành phần chính khởi chạy ứng dụng & quản lý vòng đời Session
│   ├── index.css           # Cấu hình phông chữ Geist & hệ biến màu Tailwind CSS v4
│   ├── components/         # Các thành phần giao diện dùng chung toàn dự án (Header, Footer...)
│   ├── layouts/            # Layout mẫu cấu trúc trang (MainLayout...)
│   ├── routes/             # Cấu hình phân luồng định tuyến (AppRoutes)
│   ├── shared/             # Thư viện và tiện ích dùng chung (Axios Client, Helpers...)
│   └── features/           # Các module chức năng nghiệp vụ độc lập
│       ├── auth/           # Đăng nhập, Đăng ký, Quản lý Token & Profile người dùng
│       ├── landing/        # Trang chủ tiếp thị sản phẩm (Bento Grid, Trending Products)
│       ├── cart/           # Nghiệp vụ quản lý Giỏ hàng
│       └── order/          # Nghiệp vụ Thanh toán & Quản lý đơn đặt hàng
```

---

## 🔑 Các Tính Năng Đã Triển Khai

### 1. Phân Hệ Xác Thực (Authentication Module)
- **Quản lý Session**: Tự động phục hồi phiên đăng nhập của người dùng qua `accessToken` khi khởi chạy hoặc tải lại trang (F5).
- **Trang Đăng Nhập & Đăng Ký**: Biểu mẫu xác thực hoàn chỉnh sử dụng React Hook Form kết hợp validation chặt chẽ bằng Zod.
- **Trải Nghiệm Header Thông Minh**:
  - Tự động hiển thị Avatar & Dropdown tùy chọn tài khoản khi đã đăng nhập.
  - Hiển thị hai nút Đăng nhập / Đăng ký trực quan khi ở trạng thái khách.
  - Tích hợp Skeleton loading nhằm tối ưu hiệu năng hiển thị trong thời gian kiểm tra thông tin tài khoản.

### 2. Trang Chủ (Landing Page)
- Thiết kế giao diện hiện đại kết hợp hiệu ứng chuyển động mượt mà bằng Framer Motion.
- Hệ thống danh mục sản phẩm sắp xếp theo mô hình Bento Grid trực quan.
- Khu vực trưng bày sản phẩm nổi bật hỗ trợ xem nhanh trạng thái và giá cả.


### 3. Các file .md tài liệu:
- `docs/design.md`: Tài liệu đặc tả Design System & mã màu chủ đạo.
- `docs/API_MAP.md`: Tài liệu api đã thiết kế, mô tả về api đó, muốn chi tiết thì vào xem các filename đính kèm đến controller  trong đó.
