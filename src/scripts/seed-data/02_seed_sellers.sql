-- =============================================================================
-- SEED DATA: SellerDb (PostgreSQL)
-- Shops (Owned PickUpAddress), SellerKycs (KycId = bigint/long)
-- =============================================================================

-- 1. Seed Seller KYC (6 Sellers: UserIds 2..7)
INSERT INTO "SellerKycs" ("Id", "UserId", "IdentityCardNumber", "IdentityCardFrontUrl", "IdentityCardBackUrl", "Status", "VerifiedDate", "CreatedDate")
VALUES
  (1, 2, '079090000002', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '85 days', NOW() - INTERVAL '90 days'),
  (2, 3, '079090000003', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '75 days', NOW() - INTERVAL '80 days'),
  (3, 4, '079090000004', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '65 days', NOW() - INTERVAL '70 days'),
  (4, 5, '079090000005', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '55 days', NOW() - INTERVAL '60 days'),
  (5, 6, '079090000006', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '45 days', NOW() - INTERVAL '50 days'),
  (6, 7, '079090000007', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'Approved', NOW() - INTERVAL '35 days', NOW() - INTERVAL '40 days')
ON CONFLICT ("Id") DO NOTHING;

-- 2. Seed 12 Shops for 6 Sellers (OwnerUserIds 2..7, 1..3 shops per seller)
INSERT INTO "Shops" (
  "Id", "OwnerUserId", "Name", "Description", "LogoUrl", "Status",
  "PickUp_RecipientName", "PickUp_Phone", 
  "PickUp_ProvinceId", "PickUp_DistrictId", "PickUp_WardId", 
  "PickUp_AddressLine", "CreatedDate"
)
VALUES
  -- Seller 2 (Naruto - 3 Shops)
  (1, 2, 'Konoha Tech Store', 'Chuyên cung cấp đồ công nghệ, tai nghe, phụ kiện máy tính chính hãng.', 
   'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200&auto=format&fit=crop', 'Active',
   'Uzumaki Naruto', '0901234502', 201, 1442, '20308', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1', NOW() - INTERVAL '90 days'),

  (2, 2, 'Ramen Ichiraku Official', 'Thực phẩm chế biến đóng gói, mì ăn liền nướng cay số 1.', 
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop', 'Active',
   'Uzumaki Naruto', '0901234502', 201, 1442, '20308', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1', NOW() - INTERVAL '85 days'),

  (3, 2, 'Hokage Gadgets', 'Thiết bị thông minh, đồ chơi mô hình anime độc quyền.', 
   'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop', 'Active',
   'Uzumaki Naruto', '0901234502', 201, 1442, '20308', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1', NOW() - INTERVAL '80 days'),

  -- Seller 3 (Kakashi - 2 Shops)
  (4, 3, 'Ninja Books & Media', 'Sách khoa học, tiểu thuyết, truyện tranh manga chất lượng cao.', 
   'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop', 'Active',
   'Hatake Kakashi', '0901234503', 201, 3695, '90737', '789 Phạm Văn Đồng, TP Thủ Đức', NOW() - INTERVAL '75 days'),

  (5, 3, 'Anbu Tactical Gear', 'Trang phục dã ngoại, phụ kiện phượt bảo vệ cao cấp.', 
   'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop', 'Active',
   'Hatake Kakashi', '0901234503', 201, 3695, '90737', '789 Phạm Văn Đồng, TP Thủ Đức', NOW() - INTERVAL '70 days'),

  -- Seller 4 (Sakura - 2 Shops)
  (6, 4, 'Medical Health & Skincare', 'Dược mỹ phẩm, thực phẩm chức năng chăm sóc sức khỏe.', 
   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop', 'Active',
   'Haruno Sakura', '0901234504', 202, 1444, '20401', '56 Hai Bà Trưng, Phường Bến Nghé, Quận 1', NOW() - INTERVAL '65 days'),

  (7, 4, 'Cherry Blossom Fashion', 'Thời trang nữ công sở, váy đầm thanh lịch thiết kế.', 
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop', 'Active',
   'Haruno Sakura', '0901234504', 202, 1444, '20401', '56 Hai Bà Trưng, Phường Bến Nghé, Quận 1', NOW() - INTERVAL '60 days'),

  -- Seller 5 (Sasuke - 2 Shops)
  (8, 5, 'Sharingan Gaming Gear', 'Màn hình máy tính gaming, bàn phím cơ và chuột chơi game.', 
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop', 'Active',
   'Uchiha Sasuke', '0901234505', 201, 1454, '20614', '12 Cách Mạng Tháng 8, Phường 5, Quận 3', NOW() - INTERVAL '55 days'),

  (9, 5, 'Uchiha Katanas & Sport', 'Dụng cụ thể thao cá nhân, bao đấm tập võ và phụ kiện gym.', 
   'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop', 'Active',
   'Uchiha Sasuke', '0901234505', 201, 1454, '20614', '12 Cách Mạng Tháng 8, Phường 5, Quận 3', NOW() - INTERVAL '50 days'),

  -- Seller 6 (Itachi - 2 Shops)
  (10, 6, 'Akatsuki Premium Wear', 'Thời trang unisex thời thượng, áo hoodie và streetwear cao cấp.', 
   'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&auto=format&fit=crop', 'Active',
   'Uchiha Itachi', '0901234506', 201, 1442, '20308', '88 Võ Văn Kiệt, Quận 1', NOW() - INTERVAL '45 days'),

  (11, 6, 'Crow Electronics', 'Thiết bị âm thanh cao cấp, loa bluetooth và tai nghe không dây.', 
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop', 'Active',
   'Uchiha Itachi', '0901234506', 201, 1442, '20308', '88 Võ Văn Kiệt, Quận 1', NOW() - INTERVAL '40 days'),

  -- Seller 7 (Minato - 1 Shop)
  (12, 7, 'Yellow Flash Speed Tech', 'Phụ kiện sạc nhanh siêu tốc, cáp quang và ổ cứng di động SSD.', 
   'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop', 'Active',
   'Namikaze Minato', '0901234507', 201, 1482, '21012', '99 Quang Trung, Quận Gò Vấp', NOW() - INTERVAL '35 days')
ON CONFLICT ("Id") DO NOTHING;

-- Synchronize Sequences for SellerDb
SELECT setval(pg_get_serial_sequence('"SellerKycs"', 'Id'), COALESCE((SELECT MAX("Id") FROM "SellerKycs"), 1));
SELECT setval(pg_get_serial_sequence('"Shops"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Shops"), 1));
