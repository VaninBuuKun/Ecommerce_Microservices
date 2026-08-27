-- =============================================================================
-- SEED DATA: OrderDb (PostgreSQL)
-- Vouchers (Scope = Platform & Shop)
-- =============================================================================

INSERT INTO "Vouchers" (
  "Id", "Code", "Name", "DiscountType", "DiscountValue", "Scope", 
  "MinOrderValue", "MaxUsageCount", "UsageCount", "MaxUsagePerUser", 
  "MaxDiscountAmount", "ShopId", "StartDate", "EndDate", "IsActive", "CreatedByUserId", "CreatedDate"
)
VALUES
  -- =============================================================================
  -- A. PLATFORM VOUCHERS (10 Vouchers, Scope = Platform, ShopId = NULL)
  -- =============================================================================
  (1, 'WELCOME2026', 'Voucher Chào Mừng Thành Viên Mới', 'FixedAmount', 50000, 'Platform', 150000, 1000, 12, 1, 50000, NULL, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', true, 1, NOW()),
  (2, 'FREESHIP50K', 'Miễn Phí Vận Chuyển Toàn Sàn 50K', 'FixedAmount', 50000, 'Platform', 200000, 500, 45, 2, 50000, NULL, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', true, 1, NOW()),
  (3, 'FREESHIPMAX', 'Miễn Phí Vận Chuyển Siêu Cấp 100K', 'FixedAmount', 100000, 'Platform', 500000, 300, 20, 1, 100000, NULL, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', true, 1, NOW()),
  (4, 'SALE10PCT', 'Giảm 10% Cho Đơn Hàng Từ 500K', 'Percentage', 10, 'Platform', 500000, 300, 8, 1, 100000, NULL, NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', true, 1, NOW()),
  (5, 'MEGA15PCT', 'Đại Tiệc Siêu Giảm 15% Toàn Sàn', 'Percentage', 15, 'Platform', 1000000, 200, 5, 1, 200000, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days', true, 1, NOW()),
  (6, 'FLASHSALE30K', 'Flash Sale Giờ Vàng Giảm 30K', 'FixedAmount', 30000, 'Platform', 250000, 400, 50, 2, 30000, NULL, NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days', true, 1, NOW()),
  (7, 'PAYMENTMOMO', 'Ưu Đãi Thanh Toán Momo Giảm 25K', 'FixedAmount', 25000, 'Platform', 150000, 500, 60, 2, 25000, NULL, NOW() - INTERVAL '20 days', NOW() + INTERVAL '90 days', true, 1, NOW()),
  (8, 'VNPAYQR20K', 'Giảm 20K Khi Quét VNPAY-QR', 'FixedAmount', 20000, 'Platform', 100000, 500, 35, 2, 20000, NULL, NOW() - INTERVAL '20 days', NOW() + INTERVAL '90 days', true, 1, NOW()),
  (9, 'VIPMEMBER100K', 'Tri Ân Khách Hàng VIP Giảm 100K', 'FixedAmount', 100000, 'Platform', 1200000, 150, 15, 1, 100000, NULL, NOW() - INTERVAL '15 days', NOW() + INTERVAL '120 days', true, 1, NOW()),
  (10, 'MIDMONTH50K', 'Sale Giữa Tháng Giảm 50K', 'FixedAmount', 50000, 'Platform', 400000, 250, 18, 1, 50000, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '15 days', true, 1, NOW()),

  -- =============================================================================
  -- B. SHOP VOUCHERS (25 Vouchers for 12 Shops, Scope = Shop)
  -- =============================================================================
  -- Shop 1 (Konoha Tech Store - OwnerUserId 2)
  (11, 'KONOHA20K', 'Giảm 20K cho đơn công nghệ từ 200K', 'FixedAmount', 20000, 'Shop', 200000, 200, 5, 1, 20000, 1, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true, 2, NOW()),
  (12, 'KONOHATECH5', 'Giảm 5% cho đơn tai nghe & bàn phím', 'Percentage', 5, 'Shop', 1000000, 100, 2, 1, 150000, 1, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', true, 2, NOW()),
  (13, 'KONOHASHIP30', 'Miễn phí vận chuyển Shop 30K', 'FixedAmount', 30000, 'Shop', 300000, 150, 12, 2, 30000, 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', true, 2, NOW()),

  -- Shop 2 (Ramen Ichiraku Official - OwnerUserId 2)
  (14, 'ICHIRAKU15K', 'Giảm 15K cho đơn mì & thực phẩm từ 150K', 'FixedAmount', 15000, 'Shop', 150000, 300, 25, 2, 15000, 2, NOW() - INTERVAL '20 days', NOW() + INTERVAL '60 days', true, 2, NOW()),
  (15, 'RAMEN10PCT', 'Giảm 10% tổng hóa đơn từ 300K', 'Percentage', 10, 'Shop', 300000, 150, 8, 1, 50000, 2, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', true, 2, NOW()),

  -- Shop 3 (Hokage Gadgets - OwnerUserId 2)
  (16, 'HOKAGE30K', 'Giảm 30K cho đồ chơi mô hình từ 350K', 'FixedAmount', 30000, 'Shop', 350000, 200, 14, 1, 30000, 3, NOW() - INTERVAL '25 days', NOW() + INTERVAL '60 days', true, 2, NOW()),
  (17, 'GADGET8PCT', 'Giảm 8% thiết bị thông minh từ 500K', 'Percentage', 8, 'Shop', 500000, 100, 4, 1, 80000, 3, NOW() - INTERVAL '12 days', NOW() + INTERVAL '30 days', true, 2, NOW()),

  -- Shop 4 (Ninja Books & Media - OwnerUserId 3)
  (18, 'NINJABOOK10K', 'Giảm 10K cho đơn sách & manga từ 100K', 'FixedAmount', 10000, 'Shop', 100000, 500, 40, 3, 10000, 4, NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days', true, 3, NOW()),
  (19, 'MANGA15PCT', 'Giảm 15% bộ truyện manga từ 250K', 'Percentage', 15, 'Shop', 250000, 200, 18, 2, 50000, 4, NOW() - INTERVAL '15 days', NOW() + INTERVAL '60 days', true, 3, NOW()),

  -- Shop 5 (Anbu Tactical Gear - OwnerUserId 3)
  (20, 'ANBU50K', 'Giảm 50K đồ dã ngoại phượt từ 600K', 'FixedAmount', 50000, 'Shop', 600000, 100, 6, 1, 50000, 5, NOW() - INTERVAL '20 days', NOW() + INTERVAL '60 days', true, 3, NOW()),
  (21, 'TACTICAL10', 'Giảm 10% trang phục phượt từ 400K', 'Percentage', 10, 'Shop', 400000, 150, 9, 1, 60000, 5, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', true, 3, NOW()),

  -- Shop 6 (Medical Health & Skincare - OwnerUserId 4)
  (22, 'MEDICAL25K', 'Giảm 25K skincare & mỹ phẩm từ 250K', 'FixedAmount', 25000, 'Shop', 250000, 300, 32, 2, 25000, 6, NOW() - INTERVAL '25 days', NOW() + INTERVAL '60 days', true, 4, NOW()),
  (23, 'HEALTH12PCT', 'Giảm 12% thực phẩm chức năng từ 500K', 'Percentage', 12, 'Shop', 500000, 150, 11, 1, 90000, 6, NOW() - INTERVAL '14 days', NOW() + INTERVAL '45 days', true, 4, NOW()),

  -- Shop 7 (Cherry Blossom Fashion - OwnerUserId 4)
  (24, 'CHERRY30K', 'Giảm 30K váy đầm thời trang nữ từ 300K', 'FixedAmount', 30000, 'Shop', 300000, 250, 20, 2, 30000, 7, NOW() - INTERVAL '20 days', NOW() + INTERVAL '60 days', true, 4, NOW()),
  (25, 'BLOSSOM10', 'Giảm 10% áo kiểu & blazer nữ từ 450K', 'Percentage', 10, 'Shop', 450000, 180, 15, 1, 70000, 7, NOW() - INTERVAL '8 days', NOW() + INTERVAL '30 days', true, 4, NOW()),

  -- Shop 8 (Sharingan Gaming Gear - OwnerUserId 5)
  (26, 'GAMING100K', 'Giảm 100K màn hình & gear từ 1.5 triệu', 'FixedAmount', 100000, 'Shop', 1500000, 100, 8, 1, 100000, 8, NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days', true, 5, NOW()),
  (27, 'SHARINGAN5', 'Giảm 5% bàn phím & chuột gaming từ 800K', 'Percentage', 5, 'Shop', 800000, 120, 5, 1, 100000, 8, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', true, 5, NOW()),

  -- Shop 9 (Uchiha Katanas & Sport - OwnerUserId 5)
  (28, 'UCHIHAGYM20K', 'Giảm 20K dụng cụ tập gym từ 200K', 'FixedAmount', 20000, 'Shop', 200000, 200, 19, 2, 20000, 9, NOW() - INTERVAL '18 days', NOW() + INTERVAL '60 days', true, 5, NOW()),
  (29, 'SPORT10PCT', 'Giảm 10% đồ thể thao từ 400K', 'Percentage', 10, 'Shop', 400000, 150, 10, 1, 60000, 9, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', true, 5, NOW()),

  -- Shop 10 (Akatsuki Premium Wear - OwnerUserId 6)
  (30, 'AKATSUKI40K', 'Giảm 40K áo hoodie streetwear từ 400K', 'FixedAmount', 40000, 'Shop', 400000, 200, 22, 2, 40000, 10, NOW() - INTERVAL '22 days', NOW() + INTERVAL '60 days', true, 6, NOW()),
  (31, 'STREETWEAR15', 'Giảm 15% thời trang nam nữ từ 600K', 'Percentage', 15, 'Shop', 600000, 120, 7, 1, 120000, 10, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', true, 6, NOW()),

  -- Shop 11 (Crow Electronics - OwnerUserId 6)
  (32, 'CROWAUDIO50K', 'Giảm 50K loa & tai nghe bluetooth từ 500K', 'FixedAmount', 50000, 'Shop', 500000, 150, 16, 1, 50000, 11, NOW() - INTERVAL '25 days', NOW() + INTERVAL '60 days', true, 6, NOW()),
  (33, 'CROW10PCT', 'Giảm 10% thiết bị âm thanh từ 1 triệu', 'Percentage', 10, 'Shop', 1000000, 100, 4, 1, 150000, 11, NOW() - INTERVAL '12 days', NOW() + INTERVAL '30 days', true, 6, NOW()),

  -- Shop 12 (Yellow Flash Speed Tech - OwnerUserId 7)
  (34, 'FLASHCHARGE15K', 'Giảm 15K cáp sạc & sạc nhanh từ 120K', 'FixedAmount', 15000, 'Shop', 120000, 400, 50, 3, 15000, 12, NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days', true, 7, NOW()),
  (35, 'SPEEDTECH8', 'Giảm 8% ổ cứng SSD & linh kiện từ 800K', 'Percentage', 8, 'Shop', 800000, 150, 9, 1, 100000, 12, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', true, 7, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Synchronize Voucher Sequence for Order Db
SELECT setval(pg_get_serial_sequence('"Vouchers"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Vouchers"), 1));
