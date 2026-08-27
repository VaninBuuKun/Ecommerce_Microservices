# Cẩm Nang Sử Dụng Redis CLI Toàn Tập

Tài liệu này tổng hợp toàn bộ các câu lệnh **Redis CLI (Command Line Interface)** từ cơ bản đến nâng cao, giúp lập trình viên thao tác, quản lý dữ liệu, kiểm tra hiệu năng và debug hệ thống bộ nhớ đệm (Cache) một cách hiệu quả trong quá trình phát triển dự án Microservices.

---

## 1. Kết Nối & Xác Thực (Connection & Authentication)

Để bắt đầu làm việc với Redis qua Terminal/Command Prompt, ta cần khởi động Redis CLI.

### A. Kết nối cơ bản
```bash
# Kết nối tới Redis chạy ở localhost, cổng mặc định 6379
redis-cli

# Kiểm tra kết nối (Nếu trả về PONG là thành công)
127.0.0.1:6379> PING
PONG
```

### B. Kết nối tới Server từ xa hoặc có mật khẩu
```bash
# Kết nối với host, port và password cụ thể
redis-cli -h 192.168.1.100 -p 6379 -a "my_secure_password"

# Sử dụng chuỗi URI kết nối (Redis Connection String)
redis-cli -u redis://default:password@192.168.1.100:6379/0

# Tránh cảnh báo mật khẩu hiển thị trên Terminal bằng cách nhập mật khẩu sau khi kết nối
redis-cli -h localhost -p 6379
127.0.0.1:6379> AUTH my_secure_password
OK
```

### C. Thoát khỏi CLI
```bash
127.0.0.1:6379> exit
# hoặc nhấn tổ hợp phím Ctrl + C
```

---

## 2. Quản Lý Key Cơ Bản (Basic Key Management)

Mọi dữ liệu trong Redis đều lưu dưới dạng Key-Value. Dưới đây là các lệnh thao tác trực tiếp với Key.

### A. Gán và lấy giá trị (Strings)
```bash
# Gán giá trị cho key
127.0.0.1:6379> SET user:1:name "Nguyen Van A"
OK

# Lấy giá trị của key
127.0.0.1:6379> GET user:1:name
"Nguyen Van A"

# Kiểm tra sự tồn tại của key (Trả về 1 nếu có, 0 nếu không)
127.0.0.1:6379> EXISTS user:1:name
(integer) 1

# Xóa một hoặc nhiều key
127.0.0.1:6379> DEL user:1:name
(integer) 1
```

### B. Thời gian sống của Key (TTL - Time To Live)
```bash
# Thiết lập thời gian hết hạn cho key (tính bằng giây)
127.0.0.1:6379> EXPIRE user:1:session 3600
(integer) 1  # 1: thành công, 0: key không tồn tại

# Vừa khởi tạo key vừa gán thời gian sống (Set Expiration)
127.0.0.1:6379> SETEX temp_code 60 "998877"
OK

# Kiểm tra thời gian còn lại của key (tính bằng giây)
127.0.0.1:6379> TTL user:1:session
(integer) 3540  # Trả về -1 nếu key không có thời hạn, -2 nếu key đã hết hạn/không tồn tại

# Xóa bỏ thời hạn hết hạn của key (Giúp key tồn tại vĩnh viễn)
127.0.0.1:6379> PERSIST user:1:session
(integer) 1
```

### C. Tìm kiếm và Liệt kê Key
> [!WARNING]
> **KHÔNG** sử dụng lệnh `KEYS *` trên môi trường Production vì nó sẽ block toàn bộ tiến trình đơn luồng của Redis nếu database có hàng triệu key.

```bash
# Tìm key theo pattern (Chỉ dùng ở môi trường Local/Staging)
127.0.0.1:6379> KEYS user:*

# DÙNG TRÊN PRODUCTION: Sử dụng SCAN để duyệt key an toàn mà không block server
# Cú pháp: SCAN <cursor> [MATCH pattern] [COUNT count]
127.0.0.1:6379> SCAN 0 MATCH user:* COUNT 100
1) "14"          # Cursor tiếp theo cần quét (nếu là "0" thì đã quét hết)
2) 1) "user:1"   # Danh sách các key tìm thấy ở đợt này
   2) "user:2"
```

---

## 3. Thao Tác Với Các Kiểu Dữ Liệu Nâng Cao

### A. Kiểu Hashes (Dạng Object/Dictionary)
Phù hợp để lưu trữ thông tin thực thể (ví dụ: thông tin chi tiết User, Product).
```bash
# Gán nhiều trường thông tin cho Hash
127.0.0.1:6379> HSET product:99 name "Laptop Dell" price 1500 stock 10
(integer) 3

# Lấy giá trị của một trường cụ thể
127.0.0.1:6379> HGET product:99 price
"1500"

# Lấy toàn bộ các cặp field-value của Hash
127.0.0.1:6379> HGETALL product:99
1) "name"
2) "Laptop Dell"
3) "price"
4) "1500"
5) "stock"
6) "10"

# Xóa một trường trong Hash
127.0.0.1:6379> HDEL product:99 stock
(integer) 1
```

### B. Kiểu Lists (Danh sách có thứ tự, cho phép trùng lặp)
Thường được sử dụng để làm Queue (hàng đợi gửi email, xử lý background job).
```bash
# Thêm phần tử vào bên trái (Left Push)
127.0.0.1:6379> LPUSH email_queue "email_1@test.com"
(integer) 1

# Thêm phần tử vào bên phải (Right Push)
127.0.0.1:6379> RPUSH email_queue "email_2@test.com"
(integer) 2

# Lấy ra và xóa phần tử từ bên phải (Right Pop - FIFO Queue)
127.0.0.1:6379> RPOP email_queue
"email_2@test.com"

# Xem danh sách phần tử trong khoảng index (0 là phần tử đầu, -1 là phần tử cuối)
127.0.0.1:6379> LRANGE email_queue 0 -1
1) "email_1@test.com"
```

### C. Kiểu Sets (Tập hợp không thứ tự, không trùng lặp)
Phù hợp để lưu trữ danh sách độc nhất (ví dụ: danh sách tag sản phẩm, lượt like, IP đã xem bài viết).
```bash
# Thêm phần tử vào Set
127.0.0.1:6379> SADD tags:dotnet "csharp" "efcore" "csharp"
(integer) 2 # Trả về 2 vì phần tử "csharp" trùng lặp bị bỏ qua

# Kiểm tra phần tử có thuộc Set hay không
127.0.0.1:6379> SISMEMBER tags:dotnet "csharp"
(integer) 1 # 1: Đúng, 0: Sai

# Lấy toàn bộ phần tử trong Set
127.0.0.1:6379> SMEMBERS tags:dotnet
1) "efcore"
2) "csharp"

# Lấy phần giao nhau giữa 2 Set (Intersection)
127.0.0.1:6379> SINTER tags:dotnet tags:java
```

### D. Kiểu Sorted Sets (Tập hợp có sắp xếp theo điểm số - Score)
Thích hợp làm Leaderboard (bảng xếp hạng game, bài viết hot nhất).
```bash
# Thêm phần tử kèm theo điểm số (Score)
127.0.0.1:6379> ZADD leaderboards:points 100 "User_A" 250 "User_B" 180 "User_C"
(integer) 3

# Lấy danh sách sắp xếp tăng dần theo điểm số
127.0.0.1:6379> ZRANGE leaderboards:points 0 -1 WITHSCORES
1) "User_A"
2) "100"
3) "User_C"
4) "180"
5) "User_B"
6) "250"

# Lấy danh sách sắp xếp giảm dần (Hạng cao nhất đứng đầu)
127.0.0.1:6379> ZREVRANGE leaderboards:points 0 -1 WITHSCORES
```

---

## 4. Quản Lý Hệ Thống & Database (Server & DB Management)

### A. Chọn Database làm việc
Redis có 16 database mặc định (được đánh chỉ mục từ 0 đến 15).
```bash
# Chuyển sang làm việc với Database số 1 (Mặc định ban đầu kết nối là DB 0)
127.0.0.1:6379> SELECT 1
OK
127.0.0.1:6379[1]> 
```

### B. Xóa dữ liệu (Clear Cache)
> [!CAUTION]
> Phải cực kỳ cẩn trọng khi thực hiện hai lệnh này trên môi trường Production vì nó xóa sạch dữ liệu tức thời và có thể làm sập hệ thống hạ tầng do Cache Stampede.

```bash
# Xóa SẠCH toàn bộ key của Database HIỆN TẠI đang được chọn
127.0.0.1:6379> FLUSHDB
OK

# Xóa SẠCH toàn bộ các key ở TẤT CẢ các Database trong Redis
127.0.0.1:6379> FLUSHALL
OK
```

### C. Giám sát & Debug thời gian thực (Monitoring & Debugging)
```bash
# Giám sát toàn bộ lệnh gửi tới Redis theo thời gian thực (Rất hữu ích khi debug ứng dụng xem có gọi cache đúng hay không)
127.0.0.1:6379> MONITOR
OK
1685829102.123456 [0 127.0.0.1:54321] "GET" "user:1:name"
1685829105.789123 [0 127.0.0.1:54321] "SETEX" "temp_code" "60" "998877"

# Xem thông tin cấu hình và tài nguyên phần cứng (Memory, CPU, Clients kết nối)
127.0.0.1:6379> INFO memory
# Memory
used_memory:1048576
used_memory_human:1.00M
```

---

## 5. Mẹo Chạy Lệnh Nhanh & Định Dạng Output (Non-interactive Mode)

Bạn không nhất thiết phải vào trong Redis CLI shell để chạy lệnh, có thể thực thi trực tiếp từ terminal của Hệ điều hành.

```bash
# Truy vấn nhanh giá trị của một Key trực tiếp từ Terminal
$ redis-cli -h localhost -p 6379 -a "password" GET user:1:name
"Nguyen Van A"

# Định dạng output raw (Không có dấu ngoặc kép bọc quanh chuỗi và ký tự xuống dòng thuần túy)
$ redis-cli --raw GET user:1:name
Nguyen Van A

# Xuất kết quả truy vấn dưới dạng CSV
$ redis-cli --csv HGETALL product:99
"name","Laptop Dell","price","1500"

# Đếm số lượng key trong Database hiện tại mà không block
$ redis-cli DBSIZE
(integer) 1420
```
