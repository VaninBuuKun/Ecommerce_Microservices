# Giải thích SnowflakeIdGenerator trong .NET

## Tổng quan

`SnowflakeIdGenerator` là một implementation của thuật toán **Snowflake ID** (được Twitter phát triển), dùng để sinh ra các ID kiểu `long` có những đặc điểm:

* Duy nhất (Unique)
* Tăng dần theo thời gian
* Không phụ thuộc Database Auto Increment
* Phù hợp với kiến trúc Distributed System và Microservices
* Hiệu năng rất cao

---

## Cấu trúc của Snowflake ID

ID được tạo ra từ 63 bit:

```text
| Timestamp | DatacenterId | WorkerId | Sequence |
```

Cấu hình trong code:

| Thành phần   | Số bit |
| ------------ | ------ |
| Timestamp    | 41     |
| DatacenterId | 5      |
| WorkerId     | 5      |
| Sequence     | 12     |
| Tổng         | 63     |

Bit cao nhất được giữ bằng 0 để đảm bảo giá trị luôn dương khi lưu trong kiểu `long`.

### Minh họa

```text
| 41 bits timestamp | 5 bits dc | 5 bits worker | 12 bits seq |
```

---

# Các hằng số cấu hình

## WorkerId

```csharp
private const int WorkerIdBits = 5;
```

Cho phép tối đa:

```text
2^5 - 1 = 31
```

=> Có thể hỗ trợ tối đa 32 worker.

---

## DatacenterId

```csharp
private const int DatacenterIdBits = 5;
```

Cho phép tối đa:

```text
31
```

=> Hỗ trợ tối đa 32 Datacenter.

---

## Sequence

```csharp
private const int SequenceBits = 12;
```

Cho phép:

```text
2^12 - 1 = 4095
```

=> Mỗi node có thể sinh tối đa 4096 ID trong cùng 1 millisecond.

---

## Các giá trị Max

### MaxWorkerId

```csharp
private const long MaxWorkerId =
    -1L ^ (-1L << WorkerIdBits);
```

Kết quả:

```text
11111 = 31
```

---

### MaxDatacenterId

```csharp
private const long MaxDatacenterId =
    -1L ^ (-1L << DatacenterIdBits);
```

Kết quả:

```text
31
```

---

### SequenceMask

```csharp
private const long SequenceMask =
    -1L ^ (-1L << SequenceBits);
```

Kết quả:

```text
4095
```

Mask này được dùng để giới hạn Sequence trong phạm vi 12 bit.

---

# Bit Shift

Các giá trị này xác định vị trí của từng phần trong ID cuối cùng.

## WorkerIdShift

```csharp
private const int WorkerIdShift = 12;
```

WorkerId nằm ngay sau Sequence.

```text
worker << 12
```

---

## DatacenterIdShift

```csharp
private const int DatacenterIdShift = 17;
```

```text
12 + 5
```

Datacenter nằm sau Worker.

---

## TimestampLeftShift

```csharp
private const int TimestampLeftShift = 22;
```

```text
12 + 5 + 5
```

Timestamp được đẩy sang trái 22 bit.

---

# Custom Epoch

```csharp
private const long Epoch = 1735689600000L;
```

Tương ứng:

```text
2025-01-01 00:00:00 UTC
```

---

## Tại sao cần Epoch?

Snowflake không lưu Unix Timestamp đầy đủ.

Thay vào đó:

```csharp
timestamp - Epoch
```

Ví dụ:

```text
Current Time = 2026-01-01
Epoch        = 2025-01-01
```

Khoảng cách chỉ còn:

```text
365 ngày
```

Giúp tiết kiệm bit lưu trữ.

---

# Constructor

```csharp
public SnowflakeIdGenerator(
    long workerId = 1,
    long datacenterId = 1)
```

Dùng để cấu hình node hiện tại.

Ví dụ:

```csharp
new SnowflakeIdGenerator(
    workerId: 3,
    datacenterId: 2);
```

---

## Validation

```csharp
if (workerId < 0 || workerId > MaxWorkerId)
```

Đảm bảo:

```text
0 <= WorkerId <= 31
```

---

```csharp
if (datacenterId < 0 || datacenterId > MaxDatacenterId)
```

Đảm bảo:

```text
0 <= DatacenterId <= 31
```

---

# Hàm NewId()

Đây là hàm chính chịu trách nhiệm sinh ID.

```csharp
public long NewId()
```

---

## Thread Safety

```csharp
lock (_lock)
```

Snowflake phải đảm bảo an toàn trong môi trường đa luồng.

Ví dụ:

```csharp
Parallel.For(0, 1000, _ =>
{
    generator.NewId();
});
```

Nếu không có lock, nhiều thread có thể lấy cùng timestamp và sequence, dẫn đến trùng ID.

---

# Lấy Timestamp

```csharp
var timestamp = GetCurrentTimestamp();
```

Thực chất:

```csharp
DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
```

Ví dụ:

```text
1756278000000
```

---

# Xử lý Clock Rollback

Một vấn đề phổ biến là đồng hồ hệ thống bị lùi.

Ví dụ:

```text
Lần trước: 1000 ms
Hiện tại : 995 ms
```

---

## Kiểm tra

```csharp
if (timestamp < _lastTimestamp)
```

---

## Rollback nhỏ (≤ 10ms)

```csharp
if (diff <= 10)
{
    Thread.Sleep((int)diff + 1);
}
```

Ví dụ:

```text
1000
999
```

Chỉ lệch 1ms.

Generator sẽ đợi một chút rồi lấy lại thời gian.

---

## Rollback lớn (>10ms)

```csharp
throw new InvalidOperationException(...)
```

Ví dụ:

```text
1000
900
```

Lệch 100ms.

Lúc này nguy cơ sinh ID trùng rất cao nên hệ thống từ chối tạo ID.

---

# Xử lý Sequence

Nếu vẫn đang ở cùng millisecond:

```csharp
if (_lastTimestamp == timestamp)
```

---

## Tăng Sequence

```csharp
_sequence =
    (_sequence + 1)
    & SequenceMask;
```

Ví dụ:

```text
0
1
2
3
...
4095
```

---

# Sequence Overflow

Giả sử trong cùng một millisecond tạo hơn 4096 ID.

Khi đó:

```text
4095 + 1 = 4096
```

Sau khi áp dụng mask:

```text
0
```

---

Generator phát hiện:

```csharp
if (_sequence == 0)
{
    timestamp = WaitNextMillis(_lastTimestamp);
}
```

Nó sẽ chờ đến millisecond tiếp theo rồi tiếp tục sinh ID.

---

# Sang Millisecond Mới

Nếu timestamp thay đổi:

```csharp
else
{
    _sequence = 0L;
}
```

Ví dụ:

```text
10:00:00.001
Sequence = 120

10:00:00.002
```

Reset:

```text
Sequence = 0
```

---

# Lưu Timestamp Cuối

```csharp
_lastTimestamp = timestamp;
```

Dùng để:

* So sánh rollback
* Kiểm tra cùng millisecond
* Phát hiện overflow

---

# Ghép Thành ID Cuối Cùng

Đây là đoạn quan trọng nhất:

```csharp
return ((timestamp - Epoch)
        << TimestampLeftShift)
       | (_datacenterId
        << DatacenterIdShift)
       | (_workerId
        << WorkerIdShift)
       | _sequence;
```

---

## Ví dụ

Giả sử:

```text
Timestamp Delta = 100
DatacenterId    = 2
WorkerId        = 3
Sequence        = 5
```

---

### Timestamp

```text
100 << 22
```

---

### Datacenter

```text
2 << 17
```

---

### Worker

```text
3 << 12
```

---

### Sequence

```text
5
```

---

### Kết hợp

```text
TimestampBits
OR
DatacenterBits
OR
WorkerBits
OR
SequenceBits
```

Tạo thành một số nguyên duy nhất.

---

# WaitNextMillis()

```csharp
private static long WaitNextMillis(long lastTimestamp)
{
    var timestamp = GetCurrentTimestamp();

    while (timestamp <= lastTimestamp)
    {
        timestamp = GetCurrentTimestamp();
    }

    return timestamp;
}
```

---

## Mục đích

Đợi đến millisecond tiếp theo khi Sequence bị overflow.

Ví dụ:

```text
LastTimestamp = 1000
```

Nếu vẫn:

```text
1000
1000
1000
```

Thì tiếp tục loop.

Khi:

```text
1001
```

Thì thoát.

---

# Ví dụ ID Thực Tế

Giả sử:

```text
Timestamp Delta = 5,000,000
DatacenterId    = 2
WorkerId        = 1
Sequence        = 17
```

Có thể sinh ra:

```text
20971523358737
```

---

# Ưu Điểm

✅ Không cần Database

✅ Không cần Auto Increment

✅ Sinh ID cực nhanh

✅ Sort theo thời gian

✅ Phù hợp với Event Driven Architecture

✅ Phù hợp với RabbitMQ/Kafka

✅ Tốt hơn GUID cho Index Database

---

# Nhược Điểm

❌ Phải quản lý WorkerId

Ví dụ:

```text
Identity Service  => Worker 1
Order Service     => Worker 2
Product Service   => Worker 3
```

Nếu hai node cùng:

```text
WorkerId     = 1
DatacenterId = 1
```

thì có khả năng sinh ID trùng.

---

❌ Phụ thuộc vào đồng hồ hệ thống

Nếu clock bị rollback quá lớn:

```text
Clock moved backwards
```

Generator sẽ ném exception.

---

# Áp Dụng Cho Dự Án Ecommerce Microservices

Nên dùng Snowflake cho:

```text
UserId
OrderId
ProductId
CategoryId
ReviewId
MessageId
NotificationId
VoucherId
```

---

Không nên dùng Snowflake cho:

```text
CorrelationId
TraceId
RequestId
IdempotencyKey
```

Các giá trị này nên dùng:

```text
GUID / UUID
```

vì không cần sắp xếp theo thời gian.

---

# Kết Luận

Snowflake là một giải pháp sinh ID rất phù hợp cho hệ thống Microservices vì:

* Không phụ thuộc Database
* Hỗ trợ nhiều node hoạt động song song
* ID tăng dần theo thời gian
* Hiệu năng cao
* Giảm áp lực lên Database

Với các hệ thống Ecommerce, Marketplace, Event-Driven Architecture hoặc CQRS, Snowflake thường là lựa chọn tốt hơn Auto Increment và hiệu quả hơn GUID trong nhiều trường hợp lưu trữ dữ liệu.
