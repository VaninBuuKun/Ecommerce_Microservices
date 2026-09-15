# 🚀 HƯỚNG DẪN THIẾT LẬP AWS S3, MIGRATE MINIO & ĐỒNG BỘ POSTGRESQL DATABASE

Tài liệu này hướng dẫn ngắn gọn các bước:
1. **Thiết lập AWS S3** để lưu trữ file/media và cấu hình Backend.
2. **Di chuyển dữ liệu (media) từ MinIO local lên AWS S3**.
3. **Export toàn bộ cơ sở dữ liệu PostgreSQL** từ máy cũ thành file sao lưu.
4. **Import dữ liệu vào máy mới & Tự động cập nhật database** với script `./update-db.sh`.

---

## 1. THIẾT LẬP AWS S3 CHO MEDIA STORAGE

### Bước 1: Tạo S3 Bucket
1. Truy cập [AWS S3 Console](https://s3.console.aws.amazon.com/) $\rightarrow$ Bấm **Create bucket**.
2. **Bucket name**: Đặt tên duy nhất (ví dụ: `vandz-ecommerce-media`).
3. **AWS Region**: Chọn khu vực mong muốn (ví dụ: `ap-southeast-1` - Singapore hoặc `ap-southeast-2` - Sydney).
4. **Object Ownership**: Chọn **ACLs disabled (recommended)**.
5. **Block Public Access settings**:
   * **BỎ TÍCH** ô *"Block all public access"*.
   * **Tích xác nhận**: *"I acknowledge that the current settings might result in this bucket and the objects within becoming public"*.
6. Bấm **Create bucket**.

---

### Bước 2: Cấp Quyền Đọc Công Khai (Bucket Policy)
Vào Bucket vừa tạo $\rightarrow$ tab **Permissions** $\rightarrow$ mục **Bucket policy** $\rightarrow$ Bấm **Edit** và dán:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::TEN-BUCKET-CUA-BAN/*"
        }
    ]
}
```
*(Thay `TEN-BUCKET-CUA-BAN` bằng tên bucket của bạn)* $\rightarrow$ Bấm **Save changes**.

---

### Bước 3: Cấu Hình CORS (Cho phép Frontend Upload qua Presigned URL)
Vẫn tại tab **Permissions** $\rightarrow$ cuộn xuống **Cross-origin resource sharing (CORS)** $\rightarrow$ Bấm **Edit** và dán:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```
Bấm **Save changes**.

---

### Bước 4: Tạo IAM User Lấy AccessKey & SecretKey
1. Vào dịch vụ **IAM** $\rightarrow$ mục **Users** $\rightarrow$ **Create user** (ví dụ đặt tên: `s3-upload-user`).
2. Tại trang **Set permissions**:
   * Chọn **Attach policies directly**.
   * Tìm và tích chọn: `AmazonS3FullAccess` $\rightarrow$ Bấm **Create user**.
3. Bấm vào tên user vừa tạo $\rightarrow$ tab **Security credentials** $\rightarrow$ cuộn xuống **Access keys** $\rightarrow$ **Create access key**:
   * Chọn mục đích: **Application running outside AWS** $\rightarrow$ Next $\rightarrow$ Create access key.
   * Lưu lại:
     - **Access key**: `AKIA...` (20 ký tự).
     - **Secret access key**: `...` (40 ký tự).

---

### Bước 5: Cấu Hình Vào `appsettings.Developer.json`
Mở file `src/Services/Catalogs/Ecommerce.Services.Catalog.Api/appsettings.Developer.json`:

```json
{
  "StorageSettings": {
    "AccessKey": "AKIAXXXXXXXXXXXXXXXX",
    "SecretKey": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    "ServiceUrl": "https://s3.ap-southeast-1.amazonaws.com",
    "BucketName": "TEN-BUCKET-CUA-BAN",
    "PublicUrl": "https://TEN-BUCKET-CUA-BAN.s3.ap-southeast-1.amazonaws.com"
  }
}
```
*(Thay `ap-southeast-1` bằng region bạn đã chọn, ví dụ `ap-southeast-2` nếu dùng Sydney)*.

---

## 2. DI CHUYỂN DỮ LIỆU TỪ MINIO LOCAL LÊN AWS S3

### Cách 1: Sử dụng `rclone` (Khuyên dùng - Nhanh và đơn giản nhất)
Trên máy cũ, cài đặt `rclone` và mở file cấu hình `~/.config/rclone/rclone.conf`:

```ini
[minio_local]
type = s3
provider = Minio
access_key_id = minioadmin
secret_access_key = minioadminpassword
endpoint = http://127.0.0.1:9000

[aws_s3]
type = s3
provider = AWS
access_key_id = <YOUR_AWS_ACCESS_KEY>
secret_access_key = <YOUR_AWS_SECRET_KEY>
region = ap-southeast-1
```

Chạy lệnh copy dữ liệu:
```bash
rclone copy minio_local:catalog-images aws_s3:TEN-BUCKET-CUA-BAN --progress --transfers=8
```

---

### Cách 2: Sử dụng MinIO Client (`mc`)
```bash
# 1. Thêm alias
mc alias set localminio http://127.0.0.1:9000 minioadmin minioadminpassword
mc alias set myaws https://s3.ap-southeast-1.amazonaws.com <YOUR_AWS_ACCESS_KEY> <YOUR_AWS_SECRET_KEY>

# 2. Đồng bộ
mc mirror localminio/catalog-images myaws/TEN-BUCKET-CUA-BAN
```

---

## 3. EXPORT DỮ LIỆU POSTGRESQL (TẠI MÁY CŨ)

Chạy lệnh sau trên terminal của **máy cũ** để tự động export cả 7 databases ra file nén:

```bash
mkdir -p postgres_backup && cd postgres_backup

DATABASES=("IdentityDb" "CatalogDb" "OrderDb" "PaymentDb" "SellerDb" "ShippingDb" "NotificationDb")

for db in "${DATABASES[@]}"; do
    echo "Đang export $db..."
    docker exec -t ecommerce_postgres_db pg_dump -U db_user -d "$db" --clean --if-exists -F c -b -v -f "/tmp/$db.dump"
    docker cp ecommerce_postgres_db:/tmp/$db.dump "./$db.dump"
    docker exec -t ecommerce_postgres_db rm -f "/tmp/$db.dump"
done

# Nén vào một file duy nhất để dễ copy
tar -czvf all_ecommerce_databases.tar.gz *.dump
echo "✔ Export hoàn tất: $(pwd)/all_ecommerce_databases.tar.gz"
```

*(Copy file `all_ecommerce_databases.tar.gz` sang máy mới).*

---

## 4. IMPORT DỮ LIỆU POSTGRESQL (TẠI MÁY MỚI)

1. Đảm bảo PostgreSQL container đang chạy:
   ```bash
   cd /home/vanmuzic/Projects/Ecommerce_Microservices/src
   docker compose up -d postgres_db
   ```

2. Đặt file `all_ecommerce_databases.tar.gz` vào máy mới và chạy:
   ```bash
   mkdir -p ~/db_restore && cd ~/db_restore
   # Copy all_ecommerce_databases.tar.gz vào thư mục này rồi chạy:
   tar -xzvf all_ecommerce_databases.tar.gz

   DATABASES=("IdentityDb" "CatalogDb" "OrderDb" "PaymentDb" "SellerDb" "ShippingDb" "NotificationDb")

   for db in "${DATABASES[@]}"; do
       if [ -f "$db.dump" ]; then
           echo "Đang nạp dữ liệu $db..."
           docker exec -i ecommerce_postgres_db psql -U db_user -d postgres -c "CREATE DATABASE \"$db\";" 2>/dev/null || true
           docker cp "./$db.dump" ecommerce_postgres_db:/tmp/
           docker exec -t ecommerce_postgres_db pg_restore -U db_user -d "$db" --clean --if-exists -v "/tmp/$db.dump" || true
           docker exec -t ecommerce_postgres_db rm -f "/tmp/$db.dump"
       fi
   done
   echo "✔ Hoàn tất import 7 databases!"
   ```

---

## 5. TỰ ĐỘNG CẬP NHẬT DATABASE MIGRATION

Sau khi restore hoặc khi có migration mới, dự án đã có sẵn script tự động hóa [update-db.sh](file:///home/vanmuzic/Projects/Ecommerce_Microservices/update-db.sh) tại thư mục gốc.

### Cập nhật toàn bộ 8 DbContexts (Bao gồm cả Duende IdentityServer):
```bash
cd /home/vanmuzic/Projects/Ecommerce_Microservices
./update-db.sh
```

### Cập nhật riêng từng service khi cần:
```bash
./update-db.sh catalog        # Catalog Service (ProductDbContext)
./update-db.sh identity       # Identity Service (AppDbContext)
./update-db.sh duende         # Duende IdentityServer (PersistedGrantDbContext)
./update-db.sh orders         # Orders Service (OrderDbContext)
./update-db.sh sellers        # Sellers Service (SellerDbContext)
./update-db.sh payments       # Payments Service (PaymentDbContext)
./update-db.sh shippings      # Shippings Service (ShippingDbContext)
./update-db.sh notifications  # Notifications Service (NotificationDbContext)
```
