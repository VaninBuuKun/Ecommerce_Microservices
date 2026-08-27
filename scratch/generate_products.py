import csv
import os
import re
import random

datas_dir = r"d:\Projects\Microservices\src\scripts\seed-data\datas"
output_file = r"d:\Projects\Microservices\src\scripts\seed-data\03_seed_catalog.sql"

def clean_sql(text):
    if not text:
        return ""
    text = text.replace("'", "''").replace("\n", " ").replace("\r", " ")
    return re.sub(r"\s+", " ", text).strip()

sub_categories = {
    16: "iPhone / iOS",
    17: "Điện thoại Android",
    18: "Máy tính bảng",
    19: "Laptop Gaming",
    20: "Laptop Văn phòng",
    21: "Linh kiện PC",
    22: "Tai nghe Bluetooth",
    23: "Cáp sạc & Pin dự phòng",
    24: "Bàn phím cơ & Chuột",
    25: "Áo sơ mi & Áo phông Nam",
    26: "Quần Jeans & Quần Tây Nam",
    27: "Váy đầm & Chân váy Nữ",
    28: "Áo kiểu & Áo khoác Nữ",
    29: "Bàn ghế & Nội thất",
    30: "Đèn trang trí & Đồ decor",
    31: "Nồi chiên & Lò nướng",
    32: "Máy hút bụi & Robot",
    33: "Dụng cụ tập Gym",
    34: "Lều cắm trại & Đồ phượt",
    35: "Kem dưỡng & Serum",
    36: "Son môi & Trang điểm",
    37: "Thực phẩm chức năng",
    38: "Máy đo huyết áp",
    39: "Đồng hồ Nam Nữ",
    40: "Trang sức Bạc",
    41: "Giày Sneaker & Thể thao",
    42: "Túi xách & Bóp ví da",
    43: "Tã bỉm & Sữa",
    44: "Đồ chơi giáo dục",
    45: "Nón bảo hiểm & Phụ kiện xe",
    46: "Chăm sóc xe ô tô",
    47: "Sách & Manga"
}

# Image templates per sub category for realistic UI display
images_map = {
    16: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500",
    17: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500",
    18: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
    19: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
    20: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    21: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500",
    22: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    23: "https://images.unsplash.com/photo-1609592424074-b529712a45eb?w=500",
    24: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    25: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500",
    26: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500",
    27: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
    28: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500",
    29: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500",
    30: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500",
    31: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500",
    32: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500",
    33: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500",
    34: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500",
    35: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500",
    36: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500",
    37: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500",
    38: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500",
    39: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500",
    40: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500",
    41: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    42: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
    43: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500",
    44: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500",
    45: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500",
    46: "https://images.unsplash.com/photo-1507136566006-cfc505b114fe?w=500",
    47: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"
}

# CSV product samples per file
products = []
product_id_counter = 1

# Extract real products from CSV files (first 20 per file)
csv_files = [f for f in os.listdir(datas_dir) if f.endswith('.csv')]
for csv_file in csv_files:
    file_path = os.path.join(datas_dir, csv_file)
    with open(file_path, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            if count >= 20:
                break
            name = clean_sql(row.get("name", ""))
            desc = clean_sql(row.get("description", ""))
            if not name:
                continue
            try:
                price = float(row.get("price", 150000))
                if price <= 0: price = 150000
            except:
                price = 150000
            
            orig_price = price
            try:
                orig_price = float(row.get("original_price", price))
                if orig_price < price: orig_price = price * 1.2
            except:
                orig_price = price * 1.2
                
            discount_price = price if price < orig_price else round(price * 0.85, -3)
            
            # Map category from csv filename
            cat_id = 42 # Default Túi xách
            if "men_shoes" in csv_file: cat_id = 41
            elif "women_shoes" in csv_file: cat_id = 41
            elif "men_bags" in csv_file: cat_id = 42
            elif "women_bags" in csv_file: cat_id = 42
            elif "backpacks" in csv_file: cat_id = 42
            elif "fashion_accessories" in csv_file: cat_id = 40
            
            products.append({
                "Id": product_id_counter,
                "ShopId": random.randint(1, 12),
                "Name": name[:150],
                "Description": desc[:300] if desc else f"Sản phẩm {name} chất lượng cao chính hãng.",
                "Price": orig_price,
                "DiscountPrice": discount_price,
                "AvailableStock": random.randint(30, 200),
                "Weight": round(random.uniform(0.2, 2.0), 2),
                "Length": round(random.uniform(10.0, 40.0), 1),
                "Width": round(random.uniform(10.0, 30.0), 1),
                "Height": round(random.uniform(5.0, 25.0), 1),
                "ThumbnailUrl": images_map[cat_id],
                "CategoryId": cat_id
            })
            product_id_counter += 1
            count += 1

# Generate synthetic realistic products for remaining subcategories (ensure every subcategory 16..47 has 3-4 items)
cat_counts = {cat_id: 0 for cat_id in sub_categories.keys()}
for p in products:
    cat_counts[p["CategoryId"]] += 1

# Synthetic items generator templates per category
synthetic_templates = {
    16: [("iPhone 15 Pro Max 256GB VN/A", 29990000), ("iPhone 14 128GB VN/A Chính Hãng", 17490000), ("iPhone 13 128GB Chính Hãng VNA", 13890000), ("iPhone 15 Plus 128GB Chính Hãng", 22990000)],
    17: [("Samsung Galaxy S24 Ultra 12GB/256GB", 26990000), ("Xiaomi 14 Ultra 16GB/512GB", 24990000), ("OPPO Reno11 Pro 5G 12GB/512GB", 11990000), ("Realme 12 Pro+ 5G 8GB/256GB", 8990000)],
    18: [("iPad Air 5 M1 64GB WiFi", 13990000), ("Samsung Galaxy Tab S9 FE 6GB/128GB", 8490000), ("Xiaomi Pad 6 8GB/128GB", 6990000), ("iPad Gen 10 10.9 inch 64GB WiFi", 9490000)],
    19: [("Laptop Gaming ASUS ROG Strix G16 i7", 34990000), ("Laptop Gaming Acer Nitro 5 Tiger RTX 3050", 18990000), ("Laptop Gaming MSI Katana 15 i7 RTX 4060", 25990000), ("Laptop Lenovo Legion Pro 5 R7 RTX 4070", 41990000)],
    20: [("MacBook Air M2 13.6 inch 8GB/256GB", 24490000), ("Laptop Dell XPS 13 9315 i5 16GB/512GB", 28990000), ("Laptop HP Envy 13 x360 i7 16GB", 21990000), ("Laptop Asus ZenBook 14 OLED i5", 19990000)],
    21: [("Card màn hình ASUS Dual RTX 4060 8GB", 8490000), ("Màn hình Gaming LG UltraGear 27 inch 144Hz", 5290000), ("RAM PC Corsair Vengeance RGB PRO 16GB", 1450000), ("Ổ cứng SSD Kingston NV2 1TB NVMe M.2", 1690000)],
    22: [("Tai nghe Bluetooth Apple AirPods Pro 2 MagSafe", 5690000), ("Tai nghe Chống Ôn Sony WH-1000XM5", 7990000), ("Tai nghe True Wireless Marshall Minor III", 2890000), ("Tai nghe Soundpeats Air4 Pro ANC", 1290000)],
    23: [("Pin sạc dự phòng Anker PowerCore 20000mAh 22.5W", 790000), ("Củ sạc nhanh Ugreen GaN 65W 3 cổng", 550000), ("Cáp sạc nhanh Type-C to Lightning Baseus 20W", 120000), ("Pin sạc dự phòng MagSafe Baseus 10000mAh", 490000)],
    24: [("Bàn phím cơ không dây Keychron K2 V2 Bluetooth", 1890000), ("Chuột Gaming không dây Logitech G Pro X Superlight", 2890000), ("Bàn phím cơ AKKO 3068B Plus Multi-modes", 1450000), ("Chuột không dây Silent Logitech M331", 320000)],
    25: [("Áo Sơ Mi Nam Tay Dài Form Dáng Regular Chống Nhăn", 350000), ("Áo Phông Nam Cotton 100% Cổ Tròn Dáng Rộng", 190000), ("Áo Polo Nam Vải Cá Sấu Cao Cấp Thấm Mút Mồ Hôi", 250000), ("Áo Sơ Mi Nam Trắng Cổ Tàu Phong Cách Hàn Quốc", 290000)],
    26: [("Quần Jeans Nam Dáng Ôm Co Giãn Thoải Mái", 390000), ("Quần Tây Nam Form Slimfit Hàn Quốc Chống Nhăn", 420000), ("Quần Short Jeans Nam Phong Cách Streetwear", 250000), ("Quần Kaki Nam Dáng Thẳng Lịch Lãm", 350000)],
    27: [("Váy Đầm Nữ Xếp Lý Dáng Dài Thanh Lịch", 450000), ("Chân Váy A Xếp Dáng Ngắn Phong Cách Hàn Quốc", 220000), ("Đầm Dạ Hội Nữ Cổ V Quyến Rũ Dự Tiệc", 680000), ("Váy Hoa Nhí Nữ Dáng Xòe Mùa Hè", 320000)],
    28: [("Áo Kiểu Nữ Tay Bồng Phong Cách Vintage", 280000), ("Áo Khoác Blazer Nữ 2 Lớp Form Rộng Lịch Sự", 550000), ("Áo Cardigan Len Nữ Dệt Kim Mùa Thu Đống", 320000), ("Áo Sơ Mi Nữ Lụa Cổ Thắt Nơ Công Sở", 310000)],
    29: [("Bàn Làm Việc Nâng Hạ Chiều Cao Thông Minh Siêu Bền", 3890000), ("Ghế Công Thái Học Ergonomic Chống Đau Lưng", 2490000), ("Bàn Học Sinh Chống Gù Chống Cận Cao Cấp", 1890000), ("Ghế Xoay Văn Phòng Nệm Dày Thoáng Khí", 890000)],
    30: [("Đèn LED Để Bàn Chống Cận Bảo Vệ Mắt Thông Minh", 350000), ("Đèn Ngủ Cảm Ứng Bằng Gỗ Decor Phòng Ngủ", 190000), ("Tranh Treo Tường Tráng Gương Đèn LED Decor", 650000), ("Cây Cảnh Giả Trang Trí Phòng Khách Hiện Đại", 280000)],
    31: [("Nồi Chiên Không Dầu Philips 6.2L Công Nghệ Rapid Air", 2990000), ("Nồi Chiên Không Dầu Lock&Lock 5.5L Điền Tử", 1890000), ("Lò Nướng Điện Đa Năng Sunhouse 32L", 1250000), ("Nồi Lẩu Điện Đa Năng 2 Ngăn Sunhouse 5L", 650000)],
    32: [("Robot Hút Bụi Lau Nhà Ecovacs Deebot T20 Omni", 14990000), ("Robot Hút Bụi Dreame L10 Prime Tự Rút Rác", 11990000), ("Máy Hút Bụi Cầm Tay Không Dây Deerma VC20 Plus", 990000), ("Máy Hút Bụi Giường Nệm Chống Dị Ứng Xiaomi", 690000)],
    33: [("Thảm Tập Yoga TPE 2 Lớp Chống Trượt 6mm", 250000), ("Bộ Tạ Đơn Điều Chỉnh Dung Tích 20kg Tập Gym", 750000), ("Dây Kháng Lực Tập Mông Đùi Power Band", 150000), ("Con Lăn Tập Cơ Bụng 4 Bánh Có Thảm Lót Gối", 190000)],
    34: [("Lều Cắm Trại 4 Người Tự Bung Chống Nước Chống Tia UV", 890000), ("Túi Ngủ Dã Ngoại Siêu Nhẹ Chống Lạnh", 350000), ("Đèn Pin Cắm Trại Siêu Sáng Tích Điện Đa Năng", 220000), ("Bộ Bàn Ghế Dã Ngoại Gấp Gọn Khung Nhôm", 690000)],
    35: [("Serum Dưỡng Ẩm Phục Hồi Da La Roche-Posay B5 30ml", 890000), ("Kem Dưỡng Ẩm Chuyên Sâu Clinique Moisture Surge 50ml", 950000), ("Serum Sáng Da Vitamin C Klairs Freshly Juiced 35ml", 380000), ("Kem Chống Nắng Anessa Perfect UV Milk 60ml", 520000)],
    36: [("Son Kem Lì Black Rouge Air Fit Velvet Tint", 180000), ("Phấn Nước Cushion Che Phủ Kiềm Dầu Aprilskin", 390000), ("Son Thỏi Hi-end MAC Matte Lipstick", 580000), ("Mascara Chống Nước Lâu Trôi Maybelline Hypercurl", 140000)],
    37: [("Viên Uống Collagen Youtheory Type 1 2 & 3 Mỹ 390 Viên", 650000), ("Dầu Cảnh Omega 3 Blackmores Fish Oil 1000mg 400 Viên", 550000), ("Viên Uống Vitamin C DHC 60 Ngày Nhật Bản", 150000), ("Glucosamine Bổ Khớp Kirkland 375 Viên Mỹ", 620000)],
    38: [("Máy Đo Huyết Áp Bắp Tay Omron HEM-7121 Chuẩn Y Tế", 890000), ("Cân Sức Khỏe Điện Tử Xiaomi Mi Body Composition Scale 2", 390000), ("Nhiệt Kế Hồng Ngoại Đo Trán Microlife NC200", 720000), ("Máy Đo Đường Huyết Accu-Chek Instant", 650000)],
    39: [("Đồng Hồ Nam Casio Edifice Dây Kim Loại Chống Nước", 2850000), ("Đồng Hồ Nữ Daniel Wellington Iconic Motion", 3990000), ("Đồng Hồ Nam Orient Bambino Gen 2 Cơ Kính Cong", 4500000), ("Đồng Hồ Điện Tử G-Shock DW-5600BB Siêu Bền", 2200000)],
    40: [("Dây Chuyển Bạc 925 Mặt Trái Tim Đính Đá Cao Cấp", 320000), ("Nhẫn Bạc Nam Nữ Phong Cách Minimalist", 180000), ("Vòng Tay Phong Thủy Đá Thạch Anh Tự Nhiên", 290000), ("Bông Tai Bạc Nữ Nụ Đá Lấp Lánh", 150000)],
    41: [("Giày Sneaker Nam Nữ Nike Air Force 1 White Classic", 2890000), ("Giày Chạy Bộ Adidas Ultraboost Light Siêu Ốm", 3490000), ("Giày Sneaker Vans Old Skool Black White", 1650000), ("Giày Thể Thao Bitis Hunter Core Nam Nữ", 890000)],
    42: [("Túi Xách Nữ Đeo Chéo Da Thật Cao Cấp Phong Cách Hàn Quốc", 550000), ("Ví Da Nam Dáng Ngang Da Bò Thật Chống Thấm", 320000), ("Balo Laptop Chống Nước Bama Ulzzang Unisex", 390000), ("Túi Đeo Chéo Nam Canvas Chống Nước Đa Năng", 250000)],
    43: [("Tã Quần Bobby Đệm Thấm Thần Kỳ Size XL 62 Miếng", 340000), ("Sữa Bột Enfamil A+ Neuropro Số 1 830g Cho Bé", 590000), ("Tã Dán Huggies Skincare Size M 76 Miếng", 310000), ("Sữa Bột Meiji Số 0-1 Nội Địa Nhật 800g", 520000)],
    44: [("Bộ Lắp Ráp Lego City Cảnh Sát Bắt Cướp 450 Chi Tiết", 890000), ("Bộ Đồ Chơi Gỗ Phát Triển Trí Tuệ STEM Cho Bé", 250000), ("Bảng Vẽ Tự Xóa Thông Minh Đa Năng Cho Bé", 120000), ("Bộ Đồ Chơi Bác Sĩ Cứu Thương Đầy Đủ Dụng Cụ", 190000)],
    45: [("Nón Bảo Hiểm 3/4 Royal M20KS Kính Âm Chống Chói", 480000), ("Găng Tay Xe Máy Chống Nước Chống Cắt Cảm Ứng", 160000), ("Áo Mưa Bộ Vải Dù Ánh Dương Chống Thấm Tuyệt Đối", 290000), ("Khóa Đĩa Xe Máy Chống Trộm Báo Động Hàng Chính Hãng", 220000)],
    46: [("Dung Dịch Rửa Xe Ô Tô Tạo Bọt Tuyết 3M 1 Liter", 180000), ("Bạt Phủ Che Nắng Ô Tô 3 Lớp Tráng Bạc Chống Nóng", 390000), ("Bơm Lốp Ô Tô Điện Tử Tự Động Ngắt Michelin", 890000), ("Nước Rửa Kính Ô Tô Chuyên Dụng Sonax 250ml", 140000)],
    47: [("Truyện Tranh Naruto Tập 1 - NXB Kim Đồng", 30000), ("Sách Đắc Nhân Tâm - Dale Carnegie Bìa Mềm", 85000), ("Sách Nhà Giả Kim - Paulo Coelho", 79000), ("Truyện Tranh One Piece Tập 100 Bìa Cứng Special", 45000)]
}

for cat_id, cat_name in sub_categories.items():
    current_count = cat_counts[cat_id]
    needed = max(0, 3 - current_count)
    templates = synthetic_templates.get(cat_id, [])
    
    for i in range(needed):
        tmpl_name, tmpl_price = templates[i % len(templates)]
        disc_price = round(tmpl_price * 0.88, -3)
        products.append({
            "Id": product_id_counter,
            "ShopId": random.randint(1, 12),
            "Name": clean_sql(tmpl_name),
            "Description": clean_sql(f"Sản phẩm {tmpl_name} nhập khẩu chính hãng, chất lượng cao, bảo hành 12 tháng."),
            "Price": tmpl_price,
            "DiscountPrice": disc_price,
            "AvailableStock": random.randint(40, 250),
            "Weight": round(random.uniform(0.3, 3.5), 2),
            "Length": round(random.uniform(15.0, 50.0), 1),
            "Width": round(random.uniform(10.0, 35.0), 1),
            "Height": round(random.uniform(5.0, 30.0), 1),
            "ThumbnailUrl": images_map[cat_id],
            "CategoryId": cat_id
        })
        product_id_counter += 1

print(f"Total products generated: {len(products)}")

# Read base categories SQL content up to categories
with open(output_file, 'r', encoding='utf-8') as f:
    base_sql = f.read()

# Trim any existing Product section if any
if '-- Seed Products' in base_sql:
    base_sql = base_sql.split('-- Seed Products')[0].strip()

# Build Product Insert Statements
products_sql = ["\n\n-- Seed Products (Total: " + str(len(products)) + " items covering all 32 Sub-Categories)"]
products_sql.append("""INSERT INTO "Products" (
  "Id", "ShopId", "Name", "Description", "Price", "DiscountPrice", "AvailableStock", 
  "Weight", "Length", "Width", "Height", "ThumbnailUrl", "Status", "CategoryId", 
  "AverageRating", "ReviewCount", "RatingSum", "ImageUrls"
)
VALUES""")

val_lines = []
for p in products:
    line = f"  ({p['Id']}, {p['ShopId']}, '{p['Name']}', '{p['Description']}', {p['Price']}, {p['DiscountPrice']}, {p['AvailableStock']}, {p['Weight']}, {p['Length']}, {p['Width']}, {p['Height']}, '{p['ThumbnailUrl']}', 'Active', {p['CategoryId']}, 0, 0, 0, '[\"{p['ThumbnailUrl']}\"]')"
    val_lines.append(line)

products_sql.append(",\n".join(val_lines) + "\nON CONFLICT (\"Id\") DO NOTHING;\n")

# Add sequence reset
products_sql.append("""-- Synchronize Product Sequences for Catalog Db
SELECT setval(pg_get_serial_sequence('"Products"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Products"), 1));
""")

final_content = base_sql + "\n" + "\n".join(products_sql)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Successfully updated 03_seed_catalog.sql with products seed!")
