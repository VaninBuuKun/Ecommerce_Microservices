# Hướng dẫn Toàn diện về Cookie & Bảo mật trong .NET

Tài liệu này tổng hợp kiến thức thực tế về cách hoạt động, các lỗ hổng bảo mật thường gặp và phương pháp cấu hình `CookieOptions` tối ưu khi làm việc với Cookie trong lập trình ứng dụng Web ASP.NET Core (.NET 8+).

---

## 1. Khi nào nên dùng Cookie vs LocalStorage?

Khi cần lưu trữ thông tin nhạy cảm (như Access Token, Refresh Token hoặc Session ID) ở phía Client, chúng ta thường cân nhắc giữa **Cookie (HttpOnly)** và **LocalStorage/SessionStorage**.

| Tiêu chí | Cookie (HttpOnly = true) | LocalStorage / SessionStorage |
| :--- | :--- | :--- |
| **Cơ chế hoạt động** | Được trình duyệt tự động đính kèm vào header `Cookie` của mỗi request lên Server (trong cùng Domain). | Cần dùng Javascript đọc ra và thêm thủ công vào Header (ví dụ: `Authorization: Bearer <token>`). |
| **Độ an toàn trước XSS** | **Cực kỳ an toàn**. Javascript hoàn toàn không thể đọc hoặc can thiệp nếu bật flag `HttpOnly`. | **Nguy hiểm**. Bất kỳ mã độc XSS nào chạy trên trình duyệt đều có thể lấy cắp dữ liệu dễ dàng qua `localStorage.getItem()`. |
| **Độ an toàn trước CSRF** | **Dễ bị tấn công**. Vì trình duyệt tự động gửi cookie, hacker có thể lừa người dùng click vào link độc hại để thực hiện hành vi giả mạo. | **An toàn**. Do trình duyệt không tự gửi Header, hacker không thể giả mạo trừ khi chiếm quyền điều khiển JS. |
| **Dung lượng tối đa** | Giới hạn khoảng **4 KB** cho mỗi cookie. | Lên tới **5 MB - 10 MB** tùy trình duyệt. |
| **Khuyên dùng** | Dành cho các ứng dụng Web cần tính bảo mật cao (BFF Pattern, các luồng đăng nhập quản lý Session). | Dành cho Mobile App, hoặc lưu trữ các thông tin không nhạy cảm (Cấu hình giao diện, Giỏ hàng tạm thời...). |

---

## 2. Các lỗ hổng bảo mật liên quan đến Cookie & Cách phòng chống

Khi sử dụng Cookie, bạn phải cấu hình chặt chẽ để phòng chống 3 lỗ hổng bảo mật phổ biến sau:

### A. Tấn công XSS (Cross-Site Scripting)
* **Mô tả:** Hacker chèn mã độc Javascript vào trang web (thông qua các ô nhập liệu không được kiểm soát kỹ). Script này chạy trên trình duyệt của nạn nhân và thực hiện lệnh lấy trộm Cookie.
* **Giải pháp:** Luôn cấu hình `HttpOnly = true`. Trình duyệt sẽ khóa không cho Javascript truy cập vào cookie này.

### B. Tấn công CSRF (Cross-Site Request Forgery)
* **Mô tả:** User đang đăng nhập trang web A (đã có cookie). User bấm vào link độc hại dẫn đến trang web B. Trang web B chạy script gửi request ngầm (ví dụ: chuyển tiền) đến trang web A. Trình duyệt tự động đính kèm cookie của trang A vào request -> Request được thực thi ngoài ý muốn của user.
* **Giải pháp:** 
  1. Sử dụng thuộc tính `SameSite` (`Lax` hoặc `Strict`).
  2. Sử dụng Anti-forgery Token trên các Form POST.
  3. Yêu cầu Custom Headers đối với các API AJAX/Fetch (ví dụ: `X-Requested-With`).

### C. Tấn công Man-in-the-Middle (MitM)
* **Mô tả:** Hacker nghe lén đường truyền mạng (ví dụ ở quán cafe sử dụng Wifi công cộng) và đọc trộm các gói tin HTTP gửi đi có chứa Cookie dạng plain-text.
* **Giải pháp:** Luôn cấu hình `Secure = true`. Thuộc tính này bắt buộc trình duyệt chỉ được phép gửi cookie qua kết nối được mã hóa HTTPS.

---

## 3. Cookie Authentication trong .NET

ASP.NET Core cung cấp một middleware cực kỳ mạnh mẽ để quản lý đăng nhập bằng Cookie thông qua gói thư viện `Microsoft.AspNetCore.Authentication.Cookies`.

### Cấu hình trong `Program.cs`
```csharp
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// Đăng ký dịch vụ xác thực bằng Cookie
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "AppSessionCookie"; // Tên cookie lưu ở trình duyệt
        options.Cookie.HttpOnly = true;            // Chống XSS
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Chỉ gửi qua HTTPS
        options.Cookie.SameSite = SameSiteMode.Lax; // Chống CSRF cơ bản
        
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30); // Thời hạn cookie hết hiệu lực
        options.SlidingExpiration = true; // Tự động gia hạn thời gian sống nếu User còn hoạt động
        
        options.LoginPath = "/Account/Login"; // Redirect nếu chưa đăng nhập
        options.AccessDeniedPath = "/Account/AccessDenied"; // Redirect nếu không đủ quyền truy cập
    });

var app = builder.Build();

app.UseAuthentication(); // Đọc và giải mã cookie để xác định danh tính User
app.UseAuthorization();  // Kiểm tra quyền hạn truy cập của User

app.MapControllers();
app.Run();
```

---

## 4. Các cấu hình CookieOptions khi tạo Cookie thủ công

Khi bạn muốn tự tạo và trả về Cookie từ API/Controller bằng lệnh:
`Response.Cookies.Append("Tên_Cookie", "Giá_Trị", CookieOptions)`

Bạn có thể thiết lập các cấu hình bảo mật thông qua đối tượng `CookieOptions`. Dưới đây là chi tiết các thuộc tính:

```csharp
var options = new CookieOptions
{
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Lax,
    Expires = DateTimeOffset.UtcNow.AddDays(7),
    Domain = "mywebsite.com",
    Path = "/api",
    IsEssential = true
};

Response.Cookies.Append("refreshToken", "abc123xyz...", options);
```

### Chi tiết ý nghĩa các thuộc tính:

1. **`HttpOnly` (Kiểu `bool`)**
   * **Mục đích:** Ngăn chặn Javascript truy cập cookie.
   * **Best Practice:** Luôn đặt là `true` đối với các cookie nhạy cảm như Access Token, Refresh Token, Session ID.

2. **`Secure` (Kiểu `bool`)**
   * **Mục đích:** Bắt buộc trình duyệt chỉ truyền tải cookie này thông qua giao thức bảo mật HTTPS.
   * **Best Practice:** Đặt là `true` trên môi trường Production. Trên Local development, nếu không cấu hình HTTPS, bạn có thể để `false`.

3. **`SameSite` (Kiểu `SameSiteMode`)**
   * **Mục đích:** Kiểm soát việc gửi cookie khi người dùng thực hiện các liên kết chéo trang (Cross-Site Requests).
   * **Các giá trị:**
     * `SameSiteMode.None`: Cookie luôn được gửi kèm trong mọi trường hợp (kể cả khi tải tài nguyên ngầm như hình ảnh từ trang khác). Yêu cầu bắt buộc phải set `Secure = true`.
     * `SameSiteMode.Lax` *(Khuyên dùng)*: Cookie được gửi khi người dùng click một link thông thường chuyển hướng từ trang ngoài vào trang của bạn. Chống CSRF rất tốt và giữ trải nghiệm đăng nhập mượt mà.
     * `SameSiteMode.Strict`: Cookie **chỉ** được gửi nếu hành động click xuất phát từ chính trang web của bạn. (Nếu người dùng bấm link từ Email hoặc Google tìm kiếm dẫn vào web của bạn, họ sẽ bị coi là chưa đăng nhập).

4. **`Expires` (Kiểu `DateTimeOffset?`)**
   * **Mục đích:** Xác định ngày giờ cụ thể mà Cookie sẽ tự động bị trình duyệt xóa bỏ.
   * **Lưu ý:** Nếu không đặt giá trị này, Cookie sẽ trở thành **Session Cookie** (tự động biến mất ngay khi người dùng đóng trình duyệt).

5. **`MaxAge` (Kiểu `TimeSpan?`)**
   * **Mục đích:** Đặt thời gian sống của Cookie dưới dạng khoảng thời gian (ví dụ: tồn tại trong 7 ngày). Được ưu tiên sử dụng hơn `Expires` trên các trình duyệt hiện đại.

6. **`Domain` (Kiểu `string`)**
   * **Mục đích:** Xác định những tên miền nào được phép nhận Cookie này.
   * **Ví dụ:** Nếu đặt là `.company.com`, cookie này sẽ được chia sẻ cho cả trang chính `company.com` và các subdomain con như `api.company.com`, `app.company.com`.

7. **`Path` (Kiểu `string`)**
   * **Mục đích:** Giới hạn đường dẫn URL trên server được phép nhận Cookie.
   * **Ví dụ:** Nếu đặt là `/api`, thì chỉ các request gọi lên đường dẫn bắt đầu bằng `/api` mới được trình duyệt đính kèm cookie này đi theo. Mặc định là `/` (áp dụng cho toàn trang).

8. **`IsEssential` (Kiểu `bool`)**
   * **Mục đích:** Liên quan đến chính sách GDPR (bảo vệ quyền riêng tư của Châu Âu).
   * **Lưu ý:** Nếu đặt là `true`, trình duyệt sẽ bỏ qua sự đồng ý của người dùng (Cookie Consent Banner) để ghi cookie này xuống ổ đĩa vì đây là cookie thiết yếu để duy trì hoạt động tối thiểu của hệ thống.
