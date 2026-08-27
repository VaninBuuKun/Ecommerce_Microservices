# Ecommerce Microservices - Project Overview & Guidelines

Tài liệu tóm tắt giúp các AI Agents nhanh chóng hiểu được cấu trúc và các quy tắc của dự án này khi tham gia phát triển.

---

## 1. Thông tin Backend (Microservices)

Hệ thống được phát triển bằng **.NET 8**, cấu trúc Clean Architecture và CQRS (MediatR).
*   **API Gateway (YARP)**: lắng nghe tại cổng `http://localhost:5000`. Mọi cuộc gọi từ Frontend đều đi qua đây.
*   **Identity Service**: cổng `http://localhost:5027` (chạy Duende IdentityServer, phân quyền Admin/Customer/Seller).
*   **Catalog Service**: cổng `http://localhost:5001` (Quản lý sản phẩm, danh mục 2 cấp, đánh giá sản phẩm).
*   **Cart Service**: cổng `http://localhost:5004` (Lưu giỏ hàng tạm thời trên Redis).
*   **Order Service**: cổng `http://localhost:5007` (Quản lý đơn hàng, chạy MassTransit Saga/State Machine).
*   **Payment Service**: cổng `http://localhost:5052` (Kết nối Momo, VNPay).

---

## 2. Thông tin Frontend (`frontend-web`)

Dự án Frontend được xây dựng bằng **Vite + React + TypeScript + Tailwind CSS v4**.
*   **Màu sắc chủ đạo (Theme color)**: Cam nhạt (Apricot/Soft Orange), Trắng (White/Slate-50), Đen (Pure Black/Deep Charcoal).
*   **Quản lý State**: Zustand (toàn cục tối giản) + TanStack Query (giao tiếp API).
*   **Mục tiêu cấu trúc**: Chia theo **Features** (ví dụ: `src/features/catalog`, `src/features/cart`...). Mỗi feature độc lập và tự đóng gói logic của nó.

---

## 3. Quy chuẩn Code cần ghi nhớ

### Backend:
*   Tách biệt hoàn toàn `Command/Query` ra khỏi `Handler`.
*   Không được inject trực tiếp `DbContext` vào Handler, bắt buộc dùng `IGenericEfRepository` kết hợp `Specification` hoặc Custom Repository (như `IProductRepository`).
*   Không dùng `.AsQueryable()` trực tiếp từ Repository trong Application.

### Frontend:
*   Mọi API call đều gọi qua Axios Client cấu hình tại `src/lib/axios.ts` trỏ về API Gateway.
*   Các biến cấu hình (Base URL, Storage URL) được đọc từ file `.env` qua `import.meta.env`.
