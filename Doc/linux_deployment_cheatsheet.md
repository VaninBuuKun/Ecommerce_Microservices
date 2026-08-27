# Hướng Dẫn Vận Hành & Triển Khai Dịch Vụ Trên Linux (Ubuntu/Debian)

Tài liệu này tổng hợp các câu lệnh cần thiết và các bước thực hành tốt nhất để quản lý dịch vụ (Systemd), kiểm tra hệ thống (cổng kết nối, file) và cấu hình máy chủ Web (Nginx).

---

## 1. Quản Lý Dịch Vụ Với `systemd` (`systemctl`)

Khi triển khai các dịch vụ ASP.NET Core (hoặc các dịch vụ backend khác) chạy dưới dạng background service trên Linux, chúng ta thường sử dụng `systemd`.

### Các bước cài đặt và chạy dịch vụ mới
1. **Tạo file cấu hình dịch vụ**: Tạo file cấu hình tại `/etc/systemd/system/name.service`.
2. **Reload daemon**: Báo cho systemd biết có dịch vụ mới hoặc cấu hình vừa thay đổi.
   ```bash
   sudo systemctl daemon-reload
   ```
3. **Kích hoạt tự khởi chạy**: Cho phép dịch vụ tự động khởi động cùng hệ thống khi reboot.
   ```bash
   sudo systemctl enable seller.service
   ```
4. **Khởi chạy dịch vụ**:
   ```bash
   sudo systemctl start seller.service
   ```

### Các lệnh quản trị dịch vụ thông dụng

| Lệnh | Chức năng |
| :--- | :--- |
| `sudo systemctl status name.service` | Kiểm tra trạng thái hoạt động (active, inactive, error). |
| `sudo systemctl restart name.service` | Khởi động lại dịch vụ. |
| `sudo systemctl stop name.service` | Dừng dịch vụ. |
| `sudo systemctl disable name.service` | Tắt tự động khởi chạy cùng hệ thống. |

> [!TIP]
> **Xem Log Thời Gian Thực (Real-time Logs):**
> Sử dụng lệnh `journalctl` để theo dõi nhật ký hoạt động của dịch vụ:
> ```bash
> sudo journalctl -u seller.service -f
> ```
> * `-u`: Chỉ định tên dịch vụ.
> * `-f`: Chế độ follow (theo dõi liên tục các dòng log mới).
> * Thêm `-n 100` để chỉ xem 100 dòng log gần nhất: `sudo journalctl -u seller.service -n 100 -f`

---

## 2. Kiểm Tra Cổng Kết Nối (Port) & Tiến Trình (Process)

Khi dịch vụ không chạy được hoặc báo lỗi địa chỉ đã được sử dụng (Address already in use), bạn cần kiểm tra xem port đó đang bị chiếm bởi tiến trình nào.

### Sử dụng lệnh `ss` (Khuyên dùng - Nhanh và Hiện đại)
Trên các phiên bản Ubuntu mới, lệnh `ss` được sử dụng thay thế cho lệnh `netstat` cũ nhờ tốc độ xử lý nhanh hơn.

```bash
sudo ss -tunlp
```
* **`-t`**: Xem các cổng kết nối giao thức TCP.
* **`-u`**: Xem các cổng kết nối giao thức UDP.
* **`-n`**: Hiển thị số port trực tiếp (ví dụ: `80` thay vì hiển thị tên dịch vụ `http`).
* **`-l`**: Chỉ hiển thị các cổng đang ở trạng thái lắng nghe (Listening).
* **`-p`**: Hiển thị tên tiến trình (Process Name) và mã tiến trình (PID).

#### Mẹo lọc nhanh theo cổng chỉ định:
Nếu danh sách cổng quá dài, hãy dùng `grep` để lọc:
```bash
sudo ss -tunlp | grep :80
# Hoặc lọc theo port của Seller Service (ví dụ 5042)
sudo ss -tunlp | grep :5042
```

### Sử dụng lệnh `lsof` (Lựa chọn thay thế tốt)
Nếu máy của bạn đã cài đặt `lsof`, bạn có thể kiểm tra trực tiếp tiến trình nào đang chạy trên một cổng xác định:
```bash
sudo lsof -i :5042
```

> [!WARNING]
> **Tắt tiến trình đang treo:**
> Nếu muốn giải phóng nhanh một port đang bị chiếm dụng bởi tiến trình bị treo, sử dụng lệnh `kill` với PID tìm được từ các lệnh trên:
> ```bash
> sudo kill -9 <PID>
> ```

---

## 3. Tìm Kiếm Tập Tin Trên Linux

### Tìm kiếm file trong thư mục hiện tại
* **Tìm kiếm theo đuôi mở rộng (ví dụ đuôi `.json`):**
  ```bash
  ls -la | grep "\.json$"
  ```

* **Tìm kiếm đệ quy (sâu trong cả các thư mục con):**
  ```bash
  find . -type f | grep "\.json$"
  ```

### Sử dụng lệnh `find` chuyên sâu
Lệnh `find` rất mạnh mẽ để quét hệ thống:
* **Tìm file theo tên chính xác:**
  ```bash
  find . -type f -name "*.json"
  ```
* **Tìm không phân biệt chữ hoa/thường:**
  ```bash
  find . -type f -iname "*appsettings*.json"
  ```

---

## 4. Cấu Hình Reverse Proxy Với Nginx

Nginx thường được cấu hình làm Reverse Proxy để hứng request từ cổng `80` hoặc `443` rồi chuyển tiếp về cổng nội bộ của ứng dụng (ví dụ: `http://localhost:5042`).

### 1. Vị trí file cấu hình
Cấu hình của Nginx trên Ubuntu thường nằm trong thư mục `/etc/nginx/`:
* **Cấu hình chính**: `/etc/nginx/nginx.conf`
* **Cấu hình chi tiết website**: Nằm tại `/etc/nginx/sites-available/` và được kích hoạt bằng cách tạo symlink sang `/etc/nginx/sites-enabled/`.

Xem các website hiện có:
```bash
ls /etc/nginx/sites-available/
```

### 2. Chỉnh sửa file cấu hình
Sử dụng trình soạn thảo `nano` để sửa cấu hình:
```bash
sudo nano /etc/nginx/sites-available/default
```

#### Ví dụ cấu hình Nginx Reverse Proxy cơ bản cho service:
```nginx
server {
    listen 80;
    server_name seller.yourdomain.com;

    location / {
        proxy_pass http://localhost:5042; # Port của Kestrel
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Kiểm tra và áp dụng cấu hình

> [!IMPORTANT]
> **Luôn chạy lệnh test trước khi restart Nginx:**
> Việc restart Nginx khi cấu hình bị lỗi cú pháp sẽ làm sập toàn bộ các website hiện tại trên server. Hãy luôn chạy lệnh sau để kiểm tra lỗi cú pháp trước:
> ```bash
> sudo nginx -t
> ```
> *Nếu hiển thị `nginx: configuration file test is successful`, bạn có thể yên tâm tải lại Nginx.*

* **Tải lại cấu hình (không làm gián đoạn kết nối hiện tại):**
  ```bash
  sudo systemctl reload nginx
  ```
* **Hoặc restart lại dịch vụ Nginx:**
  ```bash
  sudo systemctl restart nginx
  ```
