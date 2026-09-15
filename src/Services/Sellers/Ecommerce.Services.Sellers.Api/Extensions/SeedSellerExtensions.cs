using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Sellers.Api.Extensions;

public static class SeedSellerExtensions
{
    public static async Task SeedShopsAsync(SellerDbContext dbContext)
    {
        // 1. SEED DIVERSE SELLER KYC (VERIFIED, SUBMITTED, REJECTED, DRAFT) FOR USERS (ID 2 -> 22)
        var kycSeeds = new[]
        {
            // --- 1. VERIFIED (Chủ 13 Cửa hàng Naruto hiện tại: IDs 2 -> 11) ---
            new { UserId = 2L, IdCard = "001200000002", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 3L, IdCard = "001200000003", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 4L, IdCard = "001200000004", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 5L, IdCard = "001200000005", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 6L, IdCard = "001200000006", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 7L, IdCard = "001200000007", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 8L, IdCard = "001200000008", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 9L, IdCard = "001200000009", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 10L, IdCard = "001200000010", Status = KycStatus.Verified, RejectReason = (string?)null },
            new { UserId = 11L, IdCard = "001200000011", Status = KycStatus.Verified, RejectReason = (string?)null },

            // --- 2. SUBMITTED (Chờ Admin duyệt trên trang /admin/kyc: IDs 12 -> 17) ---
            new { UserId = 12L, IdCard = "001200000012", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Tsunade Senju
            new { UserId = 13L, IdCard = "001200000013", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Orochimaru
            new { UserId = 14L, IdCard = "001200000014", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Nagato / Pain
            new { UserId = 15L, IdCard = "001200000015", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Konan Tenshi
            new { UserId = 16L, IdCard = "001200000016", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Killer Bee
            new { UserId = 17L, IdCard = "001200000017", Status = KycStatus.Submitted, RejectReason = (string?)null }, // Tenten Ninja

            // --- 3. REJECTED (Bị từ chối kèm lý do chi tiết: IDs 18 -> 20) ---
            new { UserId = 18L, IdCard = "001200000018", Status = KycStatus.Rejected, RejectReason = "Ảnh chụp CCCD mặt trước bị mờ, phản quang chói sáng, không thể nhận diện số thẻ căn cước." }, // Kiba Inuzuka
            new { UserId = 19L, IdCard = "001200000019", Status = KycStatus.Rejected, RejectReason = "Ảnh chân dung không trùng khớp với khuôn mặt trên CCCD gắn chip (băng trán che khuất trán và chân mày)." }, // Rock Lee
            new { UserId = 20L, IdCard = "001200000020", Status = KycStatus.Rejected, RejectReason = "Giấy tờ tùy thân đã hết hiệu lực lưu hành trên hệ thống định danh quốc gia." }, // Madara Uchiha

            // --- 4. DRAFT (Người bán lưu nháp hồ sơ: IDs 21 -> 22) ---
            new { UserId = 21L, IdCard = "001200000021", Status = KycStatus.Draft, RejectReason = (string?)null }, // Neji Hyuga
            new { UserId = 22L, IdCard = "001200000022", Status = KycStatus.Draft, RejectReason = (string?)null }  // Obito Uchiha
        };

        var isExist = await dbContext.SellerKycs.AnyAsync();

        if (isExist)
        {
            return;
        }

        foreach (var item in kycSeeds)
        {
            var existingKyc = await dbContext.SellerKycs.FirstOrDefaultAsync(k => k.UserId == item.UserId);
            if (existingKyc == null)
            {
                var kyc = new SellerKyc(
                    userId: item.UserId,
                    identityCardNumber: item.IdCard,
                    identityCardFrontUrl: "https://down-vn.img.susercontent.com/file/vn-11134207-81ztc-mprhylzcy0p87d.webp",
                    identityCardBackUrl: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m70g7p0mm9mge1.webp",
                    isDraft: item.Status == KycStatus.Draft
                );

                if (item.Status == KycStatus.Verified)
                {
                    kyc.Verify();
                }
                else if (item.Status == KycStatus.Rejected)
                {
                    kyc.Reject(item.RejectReason ?? "Thông tin không hợp lệ.");
                }

                kyc.CreatedDate = DateTimeOffset.UtcNow;
                dbContext.SellerKycs.Add(kyc);
            }
        }
        await dbContext.SaveChangesAsync();

        try
        {
            await dbContext.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('\"SellerKycs\"', 'Id'), (SELECT COALESCE(MAX(\"Id\"), 1) FROM \"SellerKycs\"));");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Could not reset SellerKycs sequence: {ex.Message}");
        }

        // 2. SEED 13 NARUTO SHOPS (ID 1 -> 13)
        if (await dbContext.Shops.AnyAsync())
        {
            Console.WriteLine("ℹ️ Shops already seeded. Skipping shop seed.");
            return;
        }

        var shopsToSeed = new[]
        {
            new
            {
                Id = 1L,
                OwnerUserId = 10L, // Itachi Uchiha
                Name = "Tổ Chức Akatsuki - Cửa Hàng Nhẫn Giả Lưu Vong",
                Description = "Chuyên cung cấp áo choàng mây đỏ, nhẫn phong ấn ngón tay, nón lá chuông gió và các bí kíp nhẫn thuật cấm cấp S.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2NWlWZMJzJ-1Lpb-XtUDPKVcwp_XCbJH89IQzREsYew&s=10",
                RecipientName = "Pain / Nagato",
                Phone = "0901000001",
                AddressLine = "Hang đá mật căn cứ Akatsuki, Ngõ Mây Đỏ, Thung Lũng Tận Cùng",
                WardId = 850L,
                DistrictId = 46L,
                ProvinceId = 3L,
                Ward = "Đào Ngạn",
                District = "Hà Quảng",
                Province = "Cao Bằng"
            },
            new
            {
                Id = 2L,
                OwnerUserId = 2L, // Naruto Uzumaki
                Name = "Làng Lá - Tiệm Bách Hóa Konohagakure",
                Description = "Cửa hàng chính hãng của Hokage Đệ Thất, cung cấp băng trán Làng Lá, kunai phi tiêu và cuộn giấy triệu hồi.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXdINQC5_D959buiVfA0iT654QoJJQTnueypmfS6YxwA&s=10",
                RecipientName = "Naruto Uzumaki",
                Phone = "0901000002",
                AddressLine = "Số 7 Đỉnh Tượng Hokage, Đại Lộ Ý Chí Của Lửa, Làng Lá",
                WardId = 1700L,
                DistrictId = 100L,
                ProvinceId = 9L,
                Ward = "Ngọc Chiến",
                District = "Mường La",
                Province = "Sơn La"
            },
            new
            {
                Id = 3L,
                OwnerUserId = 11L, // Minato Namikaze
                Name = "Tiệm Mì Ramen Ichiraku",
                Description = "Mì ramen đệ nhất nhẫn giới, nước hầm xương hỏa độn 24h, kèm trứng lòng đào phong ấn thơm nức mũi.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYaEqXw-sGkl_kANYUDUJXAQZRbNGIsVaZTJyZ-dccw&s=10",
                RecipientName = "Bác Teuchi Ichiraku",
                Phone = "0901000003",
                AddressLine = "Số 1 Bến Đò Tiệm Mì Ichiraku, Cạnh Bãi Tập Số 7, Phố Ẩm Thực Konoha",
                WardId = 2550L,
                DistrictId = 144L,
                ProvinceId = 13L,
                Ward = "Vũ Lăng",
                District = "Bắc Sơn",
                Province = "Lạng Sơn"
            },
            new
            {
                Id = 4L,
                OwnerUserId = 8L, // Gaara
                Name = "Làng Cát - Tiệm Rối & Bão Cát Sunagakure",
                Description = "Chuyên hồ lô đựng cát tự động phòng ngự, rối tác chiến của Kankuro và quạt phong ba ba trăng của Temari.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR8G9ycLE9gHLyn00FEMGEa2-0lTLU9dTGySUdVLoz_rfzYGbTTj4O9dU&s=10",
                RecipientName = "Gaara Sa Mạc",
                Phone = "0901000004",
                AddressLine = "Tháp Kazekage Tầng 3, Ngõ Bão Sa Mạc, Làng Cát Sunagakure",
                WardId = 3400L,
                DistrictId = 191L,
                ProvinceId = 17L,
                Ward = "Trung Mỹ",
                District = "Bình Xuyên",
                Province = "Vĩnh Phúc"
            },
            new
            {
                Id = 5L,
                OwnerUserId = 5L, // Kakashi Hatake
                Name = "Làng Mây - Lôi Kiếm & Ráp Vần Điệu Kumogakure",
                Description = "Vũ khí truyền lôi độn, micro vàng hát rap của Bát Vĩ Killer Bee và trang bị thể thuật Lôi Cước.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAaNldIu5HMriMs-2WnSB8gDDrTLz7fbYBMig9Ge6n-g&s=10",
                RecipientName = "Killer Bee",
                Phone = "0901000005",
                AddressLine = "Hẻm Vực Sâu Mây Ngàn, Dưới Chân Tháp Raikage Đệ Tứ, Làng Mây",
                WardId = 4250L,
                DistrictId = 239L,
                ProvinceId = 22L,
                Ward = "Đề Thám",
                District = "Thái Bình",
                Province = "Thái Bình"
            },
            new
            {
                Id = 6L,
                OwnerUserId = 3L, // Sasuke Uchiha
                Name = "Làng Sương Mù - Thất Kiếm Kirigakure",
                Description = "Cửa hàng rèn đao kiếm thủy quốc: Kubikiribocho (Trảm Thủ Đại Đao), Samehada (Đại Đao Cá Mập).",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoR_mJlauJlKbmP2so23Xf02641I3cL-9STJtOg80LCQ&s=10",
                RecipientName = "Chōjūrō Thất Kiếm",
                Phone = "0901000006",
                AddressLine = "Chợ Nổi Rừng Tre Sương Mù, Cạnh Chân Cầu Tưởng Niệm Zabuza & Haku",
                WardId = 5100L,
                DistrictId = 275L,
                ProvinceId = 26L,
                Ward = "Nam Tiến",
                District = "Quan Hóa",
                Province = "Thanh Hóa"
            },
            new
            {
                Id = 7L,
                OwnerUserId = 9L, // Jiraiya
                Name = "Làng Mưa - Căn Cứ Thiên Sứ Amegakure",
                Description = "Áo mưa nhẫn giả nano chống rách, cánh bướm giấy nổ Konan và cảm biến mưa rơi nhân tạo dò tìm chakra.",
                LogoUrl = "https://i.redd.it/i-found-amegakure-hidden-rain-village-similar-to-another-v0-9jbsfn633m1f1.jpg?width=1200&format=pjpg&auto=webp&s=772dfc5b14621b0f998125878dc78590e23a90fe",
                RecipientName = "Konan Thiên Sứ",
                Phone = "0901000007",
                AddressLine = "Tầng 66 Tòa Tháp Ống Thép Làng Mưa, Đại Lộ Mưa Không Ngớt",
                WardId = 5950L,
                DistrictId = 312L,
                ProvinceId = 27L,
                Ward = "Thọ Thành",
                District = "Yên Thành",
                Province = "Nghệ An"
            },
            new
            {
                Id = 8L,
                OwnerUserId = 3L, // Sasuke Uchiha
                Name = "Gia Tộc Uchiha - Hiệu Kính & Nhãn Thuật Sharingan",
                Description = "Kính bảo hộ kháng Amaterasu, dây cước hỏa trận thuật, quạt Ba Tiêu Uchiha và mô hình Susanoo mini.",
                LogoUrl = "https://img-cdn.2game.vn/pictures/xemgame/2015/05/26/itachi-uchiha-susanoo-e1432616609161.jpg",
                RecipientName = "Sasuke Uchiha",
                Phone = "0901000008",
                AddressLine = "Khu Phố Cổ Gia Tộc Uchiha, Hẻm Hỏa Cầu Chi Thuật, Bên Kia Bờ Suối",
                WardId = 6800L,
                DistrictId = 354L,
                ProvinceId = 31L,
                Ward = "Bình Điền",
                District = "Hương Trà",
                Province = "Thừa Thiên Huế"
            },
            new
            {
                Id = 9L,
                OwnerUserId = 6L, // Hinata Hyuga
                Name = "Gia Tộc Hyuga - Võ Đường & Nhãn Lực Byakugan",
                Description = "Dược phẩm khai mở kinh lạc chakra, trang phục Nhu Quyền Bát Quái 64 Chưởng và trà đạo thượng hạng.",
                LogoUrl = "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m7968n6pcni41f.webp",
                RecipientName = "Hinata Hyuga",
                Phone = "0901000009",
                AddressLine = "Trang Viện Gia Tộc Hyuga, Phố Thấu Thị Byakugan, Khu Đông Làng Lá",
                WardId = 7650L,
                DistrictId = 419L,
                ProvinceId = 37L,
                Ward = "Cam Tân",
                District = "Cam Lâm",
                Province = "Khánh Hòa"
            },
            new
            {
                Id = 10L,
                OwnerUserId = 4L, // Sakura Haruno
                Name = "Tiệm Y Thuật & Đỏ Đen Đại Nhân Tsunade",
                Description = "Thuốc hồi phục thể lực Bách Hào Thuật, cao dán siêu cấp và xúc xắc may mắn cam kết không lừa đảo.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTD0cDdkb9J_TbpHiPqmcw_tn45TkBfC5tXNT5dx6Xbyg&s=10",
                RecipientName = "Đệ Ngũ Tsunade",
                Phone = "0901000010",
                AddressLine = "Sòng Bạc Hoàng Gia Konoha, Ngõ Xúc Xắc Thua Tiền, Cạnh Suối Nước Nóng",
                WardId = 8500L,
                DistrictId = 490L,
                ProvinceId = 43L,
                Ward = "Nâm N'Jang",
                District = "Đắk Song",
                Province = "Đắk Nông"
            },
            new
            {
                Id = 11L,
                OwnerUserId = 7L, // Shikamaru Nara
                Name = "Phòng Thí Nghiệm & Công Nghệ Sinh Học Orochimaru",
                Description = "Huyết thanh trẻ hóa làn da, chú ấn thể thao tăng cơ bắp cấp tốc và kiếm Kusanagi sắc bén thái thịt.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqWzoedm0OTLdvylixc0AsPbegLt4IdjJZToWus6QABg&s=10",
                RecipientName = "Orochimaru Rắn Chúa",
                Phone = "0901000011",
                AddressLine = "Căn Cứ Bí Mật Dưới Lòng Đất Số 18, Rừng Chết Otogakure",
                WardId = 9350L,
                DistrictId = 562L,
                ProvinceId = 50L,
                Ward = "07",
                District = "3",
                Province = "Hồ Chí Minh"
            },
            new
            {
                Id = 12L,
                OwnerUserId = 5L, // Kakashi Hatake
                Name = "Vũ Khí & Ám Khí Bách Phát Bách Trúng Tenten",
                Description = "Cuộn giấy giải phong vũ khí triệu hồi, phi tiêu shuriken mạ titan, quạt Ba Tiêu và côn nhị khúc Guy-sensei.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZG00oLyZE4pZ0LXDdbsFADkgKNCmrc4K396C5ad2vRA&s=10",
                RecipientName = "Tenten Vũ Khí",
                Phone = "0901000012",
                AddressLine = "Số 88 Ngõ Lò Rèn Nhẫn Cụ, Đối Diện Cổng Học Viện Ninja Konoha",
                WardId = 10200L,
                DistrictId = 622L,
                ProvinceId = 55L,
                Ward = "Mỹ Phước",
                District = "Mang Thít",
                Province = "Vĩnh Long"
            },
            new
            {
                Id = 13L,
                OwnerUserId = 2L, // Naruto Uzumaki
                Name = "Trang Trại Khuyển Khí & Spa Thú Cưng Inuzuka",
                Description = "Pate bổ dưỡng tăng lực cho Khuyển Ninja, dầu gội mượt lông Akamaru và phụ kiện chiến đấu Gatsuga.",
                LogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZgiCULtGLRAfOhjbo1vT3TxsS6D24IY_gf65TjHcVng&s=10",
                RecipientName = "Kiba Inuzuka",
                Phone = "0901000013",
                AddressLine = "Đồi Cỏ Gió Lộng Gia Tộc Inuzuka, Ngõ Chó Sủa Gâu Gâu, Ngoại Ô Làng Lá",
                WardId = 11050L,
                DistrictId = 699L,
                ProvinceId = 62L,
                Ward = "Định Thành",
                District = "Đông Hải",
                Province = "Bạc Liêu"
            }
        };

        foreach (var s in shopsToSeed)
        {
            var shop = new Shop(s.OwnerUserId, s.Name, s.Description, s.LogoUrl)
            {
                Id = s.Id,
                CreatedDate = DateTimeOffset.UtcNow,
                PickUpAddress = new PickUpAddress(
                    s.RecipientName,
                    s.Phone,
                    s.AddressLine,
                    s.ProvinceId,
                    s.DistrictId,
                    s.WardId
                )
            };

            dbContext.Shops.Add(shop);
        }

        await dbContext.SaveChangesAsync();

        // Đồng bộ sequence Identity của bảng Shops trong PostgreSQL để các shop mới tự tăng từ 14 trở đi
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('\"Shops\"', 'Id'), (SELECT COALESCE(MAX(\"Id\"), 1) FROM \"Shops\"));");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Could not reset Shops sequence: {ex.Message}");
        }

        Console.WriteLine($"✅ Seeded successfully {shopsToSeed.Length} Naruto-themed shops (IDs 1-13) with PickupAddress.");
    }
}
