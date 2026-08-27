-- =============================================================================
-- SEED DATA: IdentityDb (PostgreSQL)
-- Users, UserAddresses (ID = bigint/long)
-- Password for all users: password123
-- =============================================================================

-- Seed 11 Users
-- 1 Admin + 6 Sellers + 4 Customers
INSERT INTO "Users" (
  "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed",
  "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumber", "PhoneNumberConfirmed",
  "TwoFactorEnabled", "LockoutEnabled", "AccessFailedCount", "FirstName", "LastName", "IsActive", "CreatedDate"
)
VALUES
  -- 1. Admin User
  (1, 'vanpc1906@gmail.com', 'VANPC1906@GMAIL.COM', 'vanpc1906@gmail.com', 'VANPC1906@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0900000001', true, false, true, 0, 'Vân', 'Nguyễn', true, NOW()),

  -- 2..7 Sellers (6 users)
  (2, 'naruto@gmail.com', 'NARUTO@GMAIL.COM', 'naruto@gmail.com', 'NARUTO@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234502', true, false, true, 0, 'Naruto', 'Uzumaki', true, NOW() - INTERVAL '90 days'),

  (3, 'kakashi@gmail.com', 'KAKASHI@GMAIL.COM', 'kakashi@gmail.com', 'KAKASHI@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234503', true, false, true, 0, 'Kakashi', 'Hatake', true, NOW() - INTERVAL '80 days'),

  (4, 'sakura@gmail.com', 'SAKURA@GMAIL.COM', 'sakura@gmail.com', 'SAKURA@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234504', true, false, true, 0, 'Sakura', 'Haruno', true, NOW() - INTERVAL '70 days'),

  (5, 'sasuke@gmail.com', 'SASUKE@GMAIL.COM', 'sasuke@gmail.com', 'SASUKE@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234505', true, false, true, 0, 'Sasuke', 'Uchiha', true, NOW() - INTERVAL '60 days'),

  (6, 'itachi@gmail.com', 'ITACHI@GMAIL.COM', 'itachi@gmail.com', 'ITACHI@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234506', true, false, true, 0, 'Itachi', 'Uchiha', true, NOW() - INTERVAL '50 days'),

  (7, 'minato@gmail.com', 'MINATO@GMAIL.COM', 'minato@gmail.com', 'MINATO@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234507', true, false, true, 0, 'Minato', 'Namikaze', true, NOW() - INTERVAL '40 days'),

  -- 8..11 Normal Customers (4 users)
  (8, 'hinata@gmail.com', 'HINATA@GMAIL.COM', 'hinata@gmail.com', 'HINATA@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234508', true, false, true, 0, 'Hinata', 'Hyuga', true, NOW() - INTERVAL '30 days'),

  (9, 'shikamaru@gmail.com', 'SHIKAMARU@GMAIL.COM', 'shikamaru@gmail.com', 'SHIKAMARU@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234509', true, false, true, 0, 'Shikamaru', 'Nara', true, NOW() - INTERVAL '20 days'),

  (10, 'jiraiya@gmail.com', 'JIRAIYA@GMAIL.COM', 'jiraiya@gmail.com', 'JIRAIYA@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234510', true, false, true, 0, 'Jiraiya', 'Sennin', true, NOW() - INTERVAL '10 days'),

  (11, 'tsunade@gmail.com', 'TSUNADE@GMAIL.COM', 'tsunade@gmail.com', 'TSUNADE@GMAIL.COM', true,
   'AQAAAAIAAYagAAAAEG3k/vK0H3i89K2P0+zJ/1S4J7W9Q==', gen_random_uuid()::text, gen_random_uuid()::text, '0901234511', true, false, true, 0, 'Tsunade', 'Senju', true, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Seed Addresses
INSERT INTO "UserAddresses" ("Id", "UserId", "RecipientName", "Phone", "ProvinceId", "DistrictId", "WardId", "AddressLine", "IsDefault")
VALUES
  (1, 1, 'Nguyễn Vân', '0900000001', 201, 1442, 20308, '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1', true),
  (2, 2, 'Uzumaki Naruto', '0901234502', 201, 1482, 21012, '45 Lê Lợi, Phường 6, Quận Gò Vấp', true),
  (3, 3, 'Hatake Kakashi', '0901234503', 201, 3695, 90737, '789 Phạm Văn Đồng, TP Thủ Đức', true),
  (4, 4, 'Haruno Sakura', '0901234504', 202, 1444, 20401, '56 Hai Bà Trưng, Phường Bến Nghé, Quận 1', true),
  (5, 5, 'Uchiha Sasuke', '0901234505', 201, 1454, 20614, '12 Cách Mạng Tháng 8, Phường 5, Quận 3', true),
  (6, 6, 'Uchiha Itachi', '0901234506', 201, 1442, 20308, '88 Võ Văn Kiệt, Quận 1', true),
  (7, 7, 'Namikaze Minato', '0901234507', 201, 1482, 21012, '99 Quang Trung, Quận Gò Vấp', true),
  (8, 8, 'Hyuga Hinata', '0901234508', 201, 3695, 90737, '15 Kha Vạn Cân, TP Thủ Đức', true),
  (9, 9, 'Nara Shikamaru', '0901234509', 202, 1444, 20401, '20 Lý Tự Trọng, Quận 1', true),
  (10, 10, 'Jiraiya Sennin', '0901234510', 201, 1454, 20614, '300 Điện Biên Phủ, Quận 3', true),
  (11, 11, 'Senju Tsunade', '0901234511', 201, 1442, 20308, '500 Nguyễn Thị Minh Khai, Quận 1', true)
ON CONFLICT ("Id") DO NOTHING;

-- Synchronize Identity Sequence numbers so Register works without duplicate PK error
SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Users"), 1));
SELECT setval(pg_get_serial_sequence('"UserAddresses"', 'Id'), COALESCE((SELECT MAX("Id") FROM "UserAddresses"), 1));
