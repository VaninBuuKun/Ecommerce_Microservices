# 04. Senior Frontend Coding Standards & Architecture

This document defines the strict frontend architecture, library stack, and coding conventions for the React 19 web application.

---

## 🛠️ 1. Fixed Library Stack (Strict Standard)

All frontend development MUST strictly adhere to the following approved library stack. Do NOT install alternative libraries for the same purpose.

| Category | Approved Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React + TypeScript | `v19` / `v5` | Core UI Library & Type Safety |
| **Build Tool** | Vite | `v8` | Fast HMR & Production Bundling |
| **Styling & Icons** | Tailwind CSS + Lucide React | `v4` / `v1` | Utility-First Styling & Modern Icons |
| **Animations** | Framer Motion | `v12` | Smooth Micro-animations & Transitions |
| **Server State** | TanStack Query | `v5` | Data Fetching, Caching, & Synchronization |
| **Global UI State**| Zustand | `v5` | Lightweight Global UI State Management |
| **Form & Validation**| React Hook Form + Zod | `v7` / `v3` | Performant Form Management & Schema Validation |
| **HTTP Client** | Axios | `v1` | Global Interceptor & API Request Handler |
| **UI Primitives** | Radix UI | Latest | Unstyled Accessible Primitives (Popover, Dropdown) |
| **Toast Feedback** | React Toastify | `v11` | Application Notifications |
| **Routing** | React Router DOM | `v7` | Declarative Client-Side Routing |

---

## 🏗️ 2. Apps - Components - Domains (ACO) Architecture

All frontend code MUST be organized into three distinct layers:

```text
src/
├── apps/                # Page entry points grouped by actor/role
│   ├── customer/pages/  # Customer pages (HomePage, CartPage, ProductDetailPage...)
│   ├── seller/pages/    # Seller center pages (SellerDashboardPage, RegisterShopPage...)
│   ├── admin/pages/     # Admin dashboard pages (AdminDashboardPage...)
│   └── auth/pages/      # Auth standalone pages (LoginPage, RegisterPage...)
│
├── domains/             # Domain logic isolated by business boundary
│   ├── [domainName]/    # (auth, catalog, cart, order, seller, kyc, address, wallet, shipping, admin)
│   │   ├── api/         # Axios API calls
│   │   ├── hooks/       # Custom TanStack Query / React hooks
│   │   ├── stores/      # Zustand store (if needed)
│   │   ├── types/       # TypeScript DTOs & Interfaces
│   │   ├── components/  # Isolated domain-specific UI components
│   │   └── index.ts     # Public API barrel export for this domain
│
└── shared/              # Cross-cutting UI primitives & utilities
    ├── components/      # Reusable UI elements (ConfirmModal, Header, Footer, Button)
    ├── utils/           # Helper utilities (authHelper, formatters)
    └── lib/             # Global Axios instance & QueryClient setup
```

---

## 📐 3. Senior Coding Rules & Best Practices

### Rule A: Inter-Domain Isolation via Barrel Exports
- ALL inter-domain imports MUST strictly go through `@/domains/[domainName]`.
- **Allowed**: `import { AccountInfoTab } from "@/domains/auth";`
- **Forbidden**: `import { AccountInfoTab } from "@/domains/auth/components/AccountInfoTab";` or legacy `@/features/...`.
- **Server Data**: ALWAYS managed via `useQuery` / `useMutation`. NEVER sync API responses into `useState` or `Zustand` unless performing local optimism.
- **Client UI State**: Managed via `Zustand` (e.g., selected cart items, active tab, sidebar state).

### Rule B: Error Handling Standard
- Catch API errors in `useMutation` / `useQuery` via:
  ```typescript
  onError: (err: any) => {
      const message = err?.response?.data?.message || err?.response?.data || "Có lỗi xảy ra";
      toast.error(message);
  }
  ```
- HTTP `>= 500` errors are caught by Global Axios Interceptor.
- Form Validation errors are caught by `Zod` before reaching API.

### Rule C: Modal Overlay Portal Rule
- ALL Modals, Dialogs, and Floating Popups MUST use `createPortal(children, document.body)` with `z-10000` to avoid parent `overflow: hidden` or stacking context bugs.

### Rule E: Domain Isolation & No Cross-Feature Coupling (STRICT SENIOR RULE)
- **NO Direct Cross-Feature Imports**: A feature module (e.g., `src/features/seller/`) MUST NOT directly import internal hooks or services from an unrelated feature module (e.g., `src/features/order/`).
- **Shared Domains Extraction**:
  - If a resource (such as `Wallet`, `UserAddresses`, `Locations`, `Auth`) is used across multiple features, it MUST be extracted into a dedicated domain folder (e.g., `src/features/wallet/`) or `src/shared/hooks/`.
  - Example: `useWalletQuery` belongs to `src/features/wallet/` or `src/shared/`, NOT inside `src/features/order/hooks/useCheckoutQueries.ts`.
- **Actor Domain Separation**:
  - Keep Customer features (`checkout`, `catalog`), Seller Center features (`seller`), and Admin features (`admin`) strictly separated.
