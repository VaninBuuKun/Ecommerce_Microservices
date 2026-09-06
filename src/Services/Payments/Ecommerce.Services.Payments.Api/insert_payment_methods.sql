-- ==============================================================================
-- Script Insert Payment Methods (COD & MoMo) for Payments PostgreSQL Database
-- ==============================================================================

-- 1. Insert COD (Thanh toán khi nhận hàng) & MoMo (Ví điện tử MoMo)
INSERT INTO "PaymentMethods" (
    "Title", 
    "SubTitle", 
    "IsActive", 
    "ProviderName", 
    "IconUrl", 
    "MinAmount",
    "CreatedDate", 
    "LastModifiedDate"
)
VALUES 
  (
    'Thanh toán khi nhận hàng (COD)', 
    'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận hàng', 
    true, 
    'cod', 
    'https://cdn-icons-png.flaticon.com/512/2897/2897832.png', 
    NULL,
    NOW(), 
    NOW()
  ),
  (
    'Ví MoMo', 
    'Thanh toán trực tuyến qua ứng dụng ví điện tử MoMo', 
    true, 
    'momo', 
    'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png', 
    10000.00,
    NOW(), 
    NOW()
  ),
  (
    'Cổng thanh toán VNPay', 
    'Thanh toán qua quét mã QR hoặc thẻ ATM / Internet Banking', 
    true, 
    'vnpay', 
    'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png', 
    10000.00,
    NOW(), 
    NOW()
  );

-- ==============================================================================
-- Note: If PaymentMethods table uses lower_case column names depending on EF Core config,
-- PostgreSQL fallback query:
-- ==============================================================================
/*
INSERT INTO payment_methods (title, sub_title, is_active, provider_name, icon_url, created_date, last_modified_date)
VALUES 
  ('Thanh toán khi nhận hàng (COD)', 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận hàng', true, 'cod', 'https://cdn-icons-png.flaticon.com/512/2897/2897832.png', NOW(), NOW()),
  ('Ví MoMo', 'Thanh toán trực tuyến qua ứng dụng ví điện tử MoMo', true, 'momo', 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png', NOW(), NOW());
*/
