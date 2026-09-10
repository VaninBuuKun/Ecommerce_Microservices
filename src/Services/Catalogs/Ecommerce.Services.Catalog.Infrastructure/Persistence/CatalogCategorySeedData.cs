using System.Collections.Generic;

namespace Ecommerce.Services.Catalog.Infrastructure.Persistence;

public record SubCategorySeedItem(string Name, string Description, string IconUrl);

public record CategorySeedItem(
    string Name,
    string Description,
    string IconUrl,
    List<SubCategorySeedItem> SubCategories
);

public static class CatalogCategorySeedData
{
    public static readonly List<CategorySeedItem> Categories = new()
    {
        // 1. Điện Thoại & Máy Tính Bảng
        new(
            "Điện Thoại & Máy Tính Bảng",
            "Điện thoại thông minh, máy tính bảng và phụ kiện công nghệ hàng đầu",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Điện thoại di động", "Smartphone chính hãng từ Apple, Samsung, Xiaomi", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=200"),
                new("Máy tính bảng & iPad", "Máy tính bảng phục vụ học tập, làm việc và giải trí", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=200"),
                new("Pin sạc dự phòng & Bộ sạc nhanh", "Củ sạc GaN, pin sạc dự phòng dung lượng cao và cáp sạc", "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=200"),
                new("Tai nghe & Loa Bluetooth", "Tai nghe true wireless, chống ồn chủ động và loa di động", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200"),
                new("Ốp lưng, Bao da & Kính cường lực", "Bảo vệ toàn diện cho điện thoại và máy tính bảng", "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&q=80&w=200"),
                new("Gậy chụp ảnh & Giá đỡ điện thoại", "Tripod, gimbal chống rung và giá đỡ để bàn", "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 2. Máy Tính & Laptop
        new(
            "Máy Tính & Laptop",
            "Laptop văn phòng, laptop gaming, PC để bàn và linh kiện phần cứng",
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Laptop văn phòng & Học tập", "Laptop mỏng nhẹ, pin trâu từ Dell, HP, Asus, Lenovo", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=200"),
                new("Laptop Gaming chuyên nghiệp", "Laptop cấu hình khủng, màn hình tần số quét cao", "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=200"),
                new("Màn hình máy tính & PC để bàn", "Màn hình 2K, 4K đồ họa và case máy tính đồng bộ", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=200"),
                new("Bàn phím cơ & Chuột công thái học", "Bàn phím cơ custom, chuột gaming và lót chuột", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=200"),
                new("Linh kiện PC (RAM, SSD, VGA)", "Ổ cứng SSD NVMe, card đồ họa và thanh RAM nâng cấp", "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=200"),
                new("Thiết bị mạng (Router Wifi, USB)", "Bộ phát wifi Mesh, USB lưu trữ và bộ chia cổng Hub", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 3. Thiết Bị Điện Tử & Âm Thanh
        new(
            "Thiết Bị Điện Tử & Âm Thanh",
            "Tivi thông minh, máy ảnh nghệ thuật và dàn âm thanh giải trí đỉnh cao",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Smart Tivi & Màn hình giải trí", "Tivi OLED, QLED 4K, 8K từ Sony, LG, Samsung", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=200"),
                new("Loa thanh Soundbar & Dàn âm thanh", "Hệ thống âm thanh vòm rạp phim tại gia", "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=200"),
                new("Máy ảnh, Máy quay & Flycam", "Máy ảnh Mirrorless, DSLR và flycam quay phim", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200"),
                new("Máy chơi game Console & Tay cầm", "PlayStation 5, Nintendo Switch và phụ kiện gaming", "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&q=80&w=200"),
                new("Đồng hồ thông minh Smartwatch", "Apple Watch, Garmin, Galaxy Watch theo dõi sức khỏe", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 4. Điện Gia Dụng & Nhà Bếp
        new(
            "Điện Gia Dụng & Nhà Bếp",
            "Thiết bị điện gia dụng thông minh, tiện ích cho căn bếp hiện đại",
            "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Nồi chiên không dầu & Nồi áp suất", "Nấu ăn nhanh chóng, giảm 85% lượng dầu mỡ", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=200"),
                new("Nồi cơm điện & Bếp từ cao cấp", "Nồi cơm cao tần IH và bếp điện từ đôi tiết kiệm điện", "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&q=80&w=200"),
                new("Máy xay sinh tố & Máy ép hoa quả", "Máy ép chậm giữ trọn vitamin và máy xay đa năng", "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=200"),
                new("Lò vi sóng & Lò nướng đối lưu", "Hâm nóng, rã đông và nướng bánh chuyên nghiệp", "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=200"),
                new("Máy hút bụi & Robot hút bụi lau nhà", "Vệ sinh nhà cửa tự động thông minh, lực hút mạnh", "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=200"),
                new("Máy lọc không khí & Quạt điện tử", "Khử mùi, lọc bụi mịn PM2.5 bảo vệ hệ hô hấp", "https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 5. Thời Trang Nam
        new(
            "Thời Trang Nam",
            "Thời trang nam phong cách thanh lịch, trẻ trung và đa dạng xu hướng",
            "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Áo thun nam & Áo Polo", "Áo phông cotton thoáng mát, áo polo lịch sự", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200"),
                new("Áo sơ mi nam công sở & Dạo phố", "Sơ mi dài tay, ngắn tay chống nhăn form chuẩn", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=200"),
                new("Quần jean & Quần denim nam", "Quần jean ống suông, slim fit tôn dáng nam tính", "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=200"),
                new("Quần short & Quần thun thể thao nam", "Quần đùi dạo phố, thể thao thoải mái vận động", "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=200"),
                new("Áo khoác, Hoodie & Áo len nam", "Áo gió cản nước, áo hoodie nỉ ấm áp mùa lạnh", "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200"),
                new("Đồ lót & Đồ ngủ nam", "Quần lót thun lạnh kháng khuẩn và bộ đồ ngủ cotton", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 6. Thời Trang Nữ
        new(
            "Thời Trang Nữ",
            "Trang phục nữ duyên dáng, váy đầm thiết kế và bắt nhịp xu hướng mới",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Đầm dự tiệc & Váy dạo phố nữ", "Đầm xòe, đầm body, váy hoa nhí dịu dàng", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=200"),
                new("Áo thun, Croptop & Áo kiểu nữ", "Áo phông năng động, croptop tôn vòng eo", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=200"),
                new("Áo sơ mi nữ thanh lịch", "Áo sơ mi voan, sơ mi lụa công sở cao cấp", "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&q=80&w=200"),
                new("Quần jean, Quần suông & Legging nữ", "Quần jean cạp cao, quần ống rộng hack dáng", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=200"),
                new("Chân váy chữ A & Chân váy xếp ly", "Chân váy ngắn, chân váy midi xếp ly thanh thoát", "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=200"),
                new("Áo khoác, Blazer & Cardigan nữ", "Áo blazer Hàn Quốc, cardigan len mỏng nhẹ", "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 7. Giày Dép Nam
        new(
            "Giày Dép Nam",
            "Giày sneaker, giày tây da bò, giày lười và sandal nam bền đẹp",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Giày thể thao & Sneaker nam", "Giày chạy bộ, giày tập gym và sneaker đường phố", "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=200"),
                new("Giày lười Loafer & Giày tây Oxford", "Giày da thật cho quý ông công sở và sự kiện", "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=200"),
                new("Giày Sandal & Xăng đan nam", "Quai dù êm ái, thích hợp đi học và dạo mát", "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&q=80&w=200"),
                new("Dép quai ngang & Dép xỏ ngón nam", "Dép đúc nguyên khối chống trơn trượt hiệu quả", "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=200"),
                new("Giày Boot nam & Cổ cao cá tính", "Giày chelsea boot, combat boot da bụi bặm", "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=200"),
                new("Phụ kiện giày, Lót giày & Xi đánh giày", "Lót giày êm chân tăng chiều cao và chai vệ sinh giày", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 8. Giày Dép Nữ
        new(
            "Giày Dép Nữ",
            "Giày cao gót quyến rũ, giày búp bê êm ái và sneaker nữ năng động",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Giày cao gót & Đế vuông tôn dáng", "Mũi nhọn, quai mảnh tôn vinh vẻ đẹp kiêu sa", "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=200"),
                new("Giày thể thao & Sneaker nữ", "Sneaker đế độn, giày chạy bộ thời trang nữ", "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=200"),
                new("Giày búp bê & Giày mọi nữ", "Đế bệt da mềm mại, êm chân suốt cả ngày", "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&q=80&w=200"),
                new("Giày Sandal & Xăng đan nữ", "Sandal chiến binh, quai chéo điệu đà ngày hè", "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&q=80&w=200"),
                new("Dép thời trang & Dép bánh mì nữ", "Dép đế cao êm ái phong cách Hàn Quốc", "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=200"),
                new("Giày Boot nữ sành điệu", "Ankle boots, boot đùi da bóng ấm áp mùa đông", "https://images.unsplash.com/photo-1542840410-3092f99611a3?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 9. Túi Ví & Balo
        new(
            "Túi Ví & Balo",
            "Balo chống gù, túi xách nữ sang trọng, ví tiền da và vali du lịch",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Balo laptop & Balo học sinh sinh viên", "Chống sốc, chống thấm nước, nhiều ngăn chứa đồ", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200"),
                new("Túi xách nữ & Túi đeo vai cao cấp", "Túi xách công sở, túi kẹp nách sang chảnh", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200"),
                new("Ví tiền & Bóp da nam nữ", "Ví da bò, ví gập nhỏ gọn và ví đựng thẻ mini", "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200"),
                new("Túi bao tử & Túi đeo chéo thời trang", "Túi đeo ngực thể thao, phong cách streetwear", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=200"),
                new("Vali kéo du lịch & Túi hành lý", "Khung nhôm khóa TSA chịu lực va đập vượt trội", "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=200"),
                new("Túi vải Canvas & Túi Tote dạo phố", "Túi vải thân thiện môi trường, in hình cá tính", "https://images.unsplash.com/photo-1614179689702-355944cf0918?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 10. Đồng Hồ & Trang Sức
        new(
            "Đồng Hồ & Trang Sức",
            "Đồng hồ đeo tay chính hãng, dây chuyền, nhẫn và trang sức cao cấp",
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Đồng hồ nam lịch lãm", "Đồng hồ cơ Automatic, dây kim loại mạ vàng sang trọng", "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=200"),
                new("Đồng hồ nữ sang trọng", "Đồng hồ đính đá, dây da thanh lịch tôn nét nữ tính", "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&q=80&w=200"),
                new("Dây chuyền & Vòng cổ tinh xảo", "Bạc 925, titan không gỉ, đính đá lấp lánh", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200"),
                new("Nhẫn bạc & Nhẫn thời trang", "Nhẫn đôi tình yêu, nhẫn hở điều chỉnh size linh hoạt", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=200"),
                new("Vòng tay, Lắc tay & Charm phong thủy", "Vòng tay chuỗi hạt may mắn và lắc bạc xinh xắn", "https://images.unsplash.com/photo-1611591475819-79b8b4a72e31?auto=format&fit=crop&q=80&w=200"),
                new("Kính mát & Kính gọng thời trang", "Kính râm phân cực chống tia UV400 bảo vệ mắt", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 11. Sắc Đẹp & Chăm Sóc Da
        new(
            "Sắc Đẹp & Chăm Sóc Da",
            "Mỹ phẩm chăm sóc da, trang điểm, dưỡng tóc và làm đẹp toàn diện",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Chăm sóc da mặt (Serum, Kem dưỡng)", "Dưỡng ẩm, mờ thâm nám và chống lão hóa da", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200"),
                new("Làm sạch da (Sữa rửa mặt, Nước tẩy trang)", "Làm sạch sâu bụi bẩn, bã nhờn dịu nhẹ không khô rát", "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=200"),
                new("Kem chống nắng bảo vệ da", "Chỉ số SPF 50+ PA++++ kiềm dầu và nâng tone tự nhiên", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=200"),
                new("Son môi & Trang điểm môi", "Son kem lì, son dưỡng có màu bền màu lâu trôi", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=200"),
                new("Trang điểm mặt (Phấn nền, Cushion)", "Che khuyết điểm hoàn hảo, lớp nền mỏng nhẹ tự nhiên", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200"),
                new("Chăm sóc tóc (Dầu gội, Dầu xả, Serum tóc)", "Phục hồi tóc hư tổn, giảm rụng tóc và kích mọc tóc", "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 12. Sức Khỏe & Thực Phẩm Chức Năng
        new(
            "Sức Khỏe & Thực Phẩm Chức Năng",
            "Vitamin bổ sung, thực phẩm dinh dưỡng và thiết bị theo dõi sức khỏe gia đình",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Vitamin & Khoáng chất tổng hợp", "Bổ sung Vitamin C, D3, Kẽm tăng cường đề kháng", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200"),
                new("Dinh dưỡng thể thao (Whey Protein, BCAA)", "Tăng cơ giảm mỡ, hỗ trợ phục hồi cơ bắp tập luyện", "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=200"),
                new("Thiết bị y tế (Máy đo huyết áp, Máy đo đường huyết)", "Kiểm tra sức khỏe tại nhà chính xác, dễ sử dụng", "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=200"),
                new("Khẩu trang y tế & Dung dịch sát khuẩn", "Khẩu trang 4 lớp kháng khuẩn, cồn y tế an toàn", "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&q=80&w=200"),
                new("Trà thảo mộc & Tinh dầu tự nhiên", "Thanh lọc cơ thể, giúp ngủ ngon và giải tỏa căng thẳng", "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 13. Mẹ & Bé
        new(
            "Mẹ & Bé",
            "Tã bỉm cao cấp, sữa công thức, dinh dưỡng ăn dặm và đồ chơi trẻ em",
            "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Tã dán & Bỉm quần em bé", "Thấm hút siêu tốc, chống hăm mông bé mềm mại", "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=200"),
                new("Sữa bột & Đồ ăn dặm dinh dưỡng", "Sữa công thức phát triển chiều cao và trí não", "https://images.unsplash.com/photo-1576188973526-0e5d7047b0cf?auto=format&fit=crop&q=80&w=200"),
                new("Quần áo sơ sinh & Trẻ em", "Chất vải sợi tre organic thoáng khí, không kích ứng", "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=200"),
                new("Bình sữa, Máy tiệt trùng & Ti giả", "Chất liệu PPSU an toàn, núm ti mô phỏng ti mẹ", "https://images.unsplash.com/photo-1584839610506-57c517453dd0?auto=format&fit=crop&q=80&w=200"),
                new("Xe đẩy, Ghế ăn dặm & Địu em bé", "Thiết kế giảm xóc, tư thế ngồi chuẩn công thái học", "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=200"),
                new("Đồ chơi giáo dục & Phát triển trí tuệ", "Lego lắp ráp, bảng chữ cái gỗ kích thích tư duy", "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 14. Nhà Cửa & Đời Sống
        new(
            "Nhà Cửa & Đời Sống",
            "Nội thất gia đình, chăn ga gối đệm, đèn trang trí và dụng cụ gia đình",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Chăn, Ga, Gối & Nệm cao cấp", "Vải tencel mát lạnh, ruột gối lông vũ nhân tạo", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200"),
                new("Nội thất phòng khách & Phòng ngủ", "Bàn làm việc, ghế công thái học và kệ tivi hiện đại", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200"),
                new("Đèn trang trí & Đèn bàn đọc sách", "Đèn led chống cận thị, đèn ngủ cảm ứng thông minh", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=200"),
                new("Dụng cụ vệ sinh & Chất tẩy rửa hữu cơ", "Cây lau nhà tự vắt, nước giặt xả sinh học an toàn", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200"),
                new("Hộp đựng đồ, Kệ sách & Tủ để đồ đa năng", "Tối ưu hóa không gian phòng, sắp xếp nhà cửa gọn gàng", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=200"),
                new("Nến thơm & Tinh dầu khuếch tán", "Hương thơm thư giãn, tinh dầu thơm phòng cao cấp", "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 15. Thể Thao & Dã Ngoại
        new(
            "Thể Thao & Dã Ngoại",
            "Dụng cụ tập gym, yoga, thời trang thể thao và thiết bị dã ngoại dã chiến",
            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Dụng cụ Gym, Yoga & Thể hình tại nhà", "Thảm yoga chống trượt, tạ tay và dây kháng lực", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200"),
                new("Quần áo & Đồ tập thể thao co giãn", "Thun lạnh 4 chiều, thấm hút mồ hôi tối đa", "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=200"),
                new("Vợt cầu lông, Tennis & Bóng bàn", "Vợt carbon siêu nhẹ trợ lực, quả cầu lông thi đấu", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=200"),
                new("Bóng đá, Bóng rổ & Phụ kiện sân cỏ", "Bóng may tay tiêu chuẩn FIFA, găng tay thủ môn", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=200"),
                new("Lều trại, Bàn ghế & Đồ cắm trại dã ngoại", "Lều tự bung chống mưa, bếp nướng dã ngoại tiện lợi", "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=200"),
                new("Xe đạp thể thao & Nón bảo hiểm xe đạp", "Xe đạp địa hình touring, đèn còi xe đạp an toàn", "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 16. Ô Tô, Xe Máy & Xe Đạp
        new(
            "Ô Tô, Xe Máy & Xe Đạp",
            "Mũ bảo hiểm đạt chuẩn, phụ tùng, đồ chơi xe và dầu nhớt động cơ",
            "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Mũ bảo hiểm & Đồ bảo hộ phượt", "Mũ 3/4, fullface đạt chuẩn DOT, găng tay xe máy", "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200"),
                new("Phụ kiện & Đồ chơi trang trí ô tô", "Giá đỡ điện thoại, bọc vô lăng da và tẩu sạc ô tô", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=200"),
                new("Dầu nhớt & Hóa chất chăm sóc xe", "Nhớt tổng hợp toàn phần, xịt dưỡng sên xe máy", "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200"),
                new("Camera hành trình & Cảm biến áp suất", "Quay video 4K góc rộng, cảnh báo va chạm thông minh", "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=200"),
                new("Khóa chống trộm & Đèn trợ sáng xe máy", "Khóa đĩa báo động, đèn LED trợ sáng xuyên sương", "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 17. Sách & Văn Phòng Phẩm
        new(
            "Sách & Văn Phòng Phẩm",
            "Sách bán chạy, văn học, kỹ năng sống, bút viết và sổ tay sáng tạo",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Sách văn học & Tiểu thuyết kinh điển", "Tác phẩm văn học trong nước và quốc tế kinh điển", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200"),
                new("Sách kinh tế, Đầu tư & Kỹ năng sống", "Phát triển bản thân, tư duy tài chính và khởi nghiệp", "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=200"),
                new("Sách ngoại ngữ & Luyện thi chứng chỉ", "Tài liệu học IELTS, TOEIC, tiếng Nhật và tiếng Trung", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=200"),
                new("Bút viết, Bút ký & Bút highlight", "Bút gel mực êm, bút dạ quang và bút ký kim loại", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=200"),
                new("Sổ tay ghi chép, Giấy in & Bìa còng", "Sổ tay bìa da, giấy note vàng và giấy in văn phòng", "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=200"),
                new("Họa cụ vẽ tranh & Dụng cụ thủ công DIY", "Màu nước, cọ vẽ, bút chì màu và đất nặn tạo hình", "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 18. Bách Hóa Online & Thực Phẩm
        new(
            "Bách Hóa Online & Thực Phẩm",
            "Bánh kẹo, đồ ăn vặt, trà cà phê giải khát và gia vị truyền thống",
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Bánh kẹo & Snack giòn rụm", "Khoai tây sấy, bánh quy bơ và snack rong biển", "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&q=80&w=200"),
                new("Cà phê hòa tan, Trà & Đồ uống", "Cà phê Robusta đậm vị, trà sen, trà đào thanh mát", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200"),
                new("Ngũ cốc yến mạch & Hạt dinh dưỡng", "Hạt óc chó, hạnh nhân, hạt điều rang muối thơm ngon", "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&q=80&w=200"),
                new("Mì ăn liền, Bún miến & Thực phẩm đóng hộp", "Mì cay, bún bò sấy khô và cá hộp thơm ngon tiện lợi", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=200"),
                new("Gia vị nấu ăn, Dầu ăn & Nước mắm", "Nước mắm cá cơm truyền thống, dầu olive nguyên chất", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200"),
                new("Đặc sản vùng miền & Thực phẩm khô", "Khô gà lá chanh, thịt bò khô xé cay ăn vặt", "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=200")
            }
        ),

        // 19. Chăm Sóc Thú Cưng
        new(
            "Chăm Sóc Thú Cưng",
            "Thức ăn bổ dưỡng, cát vệ sinh, đồ chơi và spa mượt lông cho cún mèo",
            "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=200",
            new List<SubCategorySeedItem>
            {
                new("Thức ăn khô & Pate cho chó mèo", "Hạt dinh dưỡng kiểm soát búi lông, pate thơm ngậy", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200"),
                new("Cát vệ sinh & Khay cát khử mùi", "Cát đất sét vón cục nhanh, khử mùi hôi hiệu quả", "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200"),
                new("Vòng cổ, Dây dắt & Balo vận chuyển thú cưng", "Balo phi hành gia thoáng khí cho thú cưng đi chơi", "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=200"),
                new("Đồ chơi gặm cắn & Bàn cào móng mèo", "Bóng cao su, trụ cào móng xơ dừa giúp thú cưng vui vẻ", "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=200"),
                new("Sữa tắm mượt lông & Xịt thơm thú cưng", "Dầu gội trị ve rận, mượt lông không cay mắt", "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200")
            }
        )
    };
}
