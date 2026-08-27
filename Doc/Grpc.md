# Tài liệu tổng hợp về gRPC, HTTP và lựa chọn giao tiếp trong Microservices

## 1. Mục tiêu tài liệu

Tài liệu này giải thích:

* gRPC là gì.
* Tại sao nhiều hệ thống microservices chọn gRPC.
* gRPC khác gì REST API thông thường.
* HTTP đã phát triển như thế nào từ HTTP/0.9, HTTP/1.0, HTTP/1.1, HTTP/2 đến HTTP/3.
* Khi nào nên dùng REST, gRPC, GraphQL, WebSocket, SSE, Message Queue.
* Cách áp dụng gRPC vào hệ thống ecommerce/microservices .NET.

---

# 2. Trước hết: HTTP là gì?

HTTP, viết tắt của HyperText Transfer Protocol, là giao thức nền tảng để client và server trao đổi dữ liệu trên web.

Ví dụ đơn giản:

```txt
Browser / Mobile / Frontend
        |
        | HTTP Request
        v
Backend API
        |
        | HTTP Response
        v
Client nhận dữ liệu
```

Một request HTTP thường có:

```http
GET /api/products/123 HTTP/1.1
Host: shop.com
Authorization: Bearer token
Accept: application/json
```

Một response HTTP thường có:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "123",
  "name": "Laptop",
  "price": 1200
}
```

HTTP ban đầu sinh ra để tải tài liệu web, nhưng về sau trở thành nền tảng cho API, web app, mobile app, microservices, gateway, CDN, streaming, realtime, và rất nhiều loại hệ thống phân tán.

---

# 3. Lịch sử các phiên bản HTTP

Cần phân biệt rõ:

```txt
HTTP/1.1, HTTP/2, HTTP/3 = phiên bản giao thức HTTP
REST, GraphQL, gRPC, WebSocket = kiểu thiết kế/giao tiếp API
```

gRPC không phải là HTTP/3 hay HTTP/2. gRPC là một framework RPC chạy chủ yếu trên HTTP/2.

---

## 3.1. HTTP/0.9

HTTP/0.9 là phiên bản rất sơ khai.

Đặc điểm:

* Chỉ hỗ trợ GET.
* Không có header.
* Không có status code.
* Không có content type.
* Chủ yếu dùng để lấy file HTML.

Ví dụ rất đơn giản:

```http
GET /index.html
```

Server trả thẳng nội dung HTML về.

Thời này HTTP chưa phải nền tảng API như bây giờ.

---

## 3.2. HTTP/1.0

HTTP/1.0 bắt đầu có cấu trúc giống HTTP hiện đại hơn.

Có thêm:

* Method: GET, POST, HEAD.
* Header.
* Status code.
* Content-Type.
* Request/response rõ ràng hơn.

Ví dụ:

```http
GET /products HTTP/1.0
Host: shop.com
Accept: application/json
```

Vấn đề lớn của HTTP/1.0 là thường mỗi request mở một TCP connection mới.

Ví dụ trang web cần tải:

```txt
index.html
style.css
app.js
logo.png
banner.png
```

Có thể phải mở nhiều kết nối TCP riêng biệt. Việc này tốn tài nguyên và tăng độ trễ.

---

## 3.3. HTTP/1.1

HTTP/1.1 là nền tảng rất phổ biến trong nhiều năm và đến nay vẫn còn dùng rất nhiều.

Cải tiến chính:

* Persistent connection: một TCP connection có thể dùng cho nhiều request.
* Host header: một server có thể host nhiều domain.
* Chunked transfer encoding: gửi dữ liệu theo từng chunk.
* Better caching.
* Pipelining, dù thực tế không được dùng nhiều vì dễ gặp head-of-line blocking.

HTTP/1.1 là nền tảng của REST API truyền thống.

Ví dụ REST API:

```http
GET /api/products
POST /api/orders
PUT /api/products/123
DELETE /api/cart/items/456
```

Vấn đề của HTTP/1.1:

* Dữ liệu là text-based, dễ đọc nhưng không tối ưu dung lượng.
* Mỗi request/response đi theo thứ tự trên connection.
* Không có multiplexing thật sự.
* Nếu nhiều request cùng lúc, client thường phải mở nhiều TCP connection.
* Header lặp lại nhiều lần, gây thừa dữ liệu.
* Không tối ưu cho service-to-service call mật độ cao.

---

## 3.4. HTTP/2

HTTP/2 giữ nguyên ý nghĩa HTTP nhưng thay đổi cách truyền dữ liệu bên dưới.

Điểm quan trọng:

* Binary protocol: dữ liệu được chia thành frame nhị phân.
* Multiplexing: nhiều request/response có thể đi chung trên một TCP connection.
* Header compression: giảm kích thước header.
* Stream: mỗi request/response là một stream logic.
* Tối ưu hơn HTTP/1.1 cho nhiều request đồng thời.

Hình dung HTTP/1.1:

```txt
Connection 1: Request A -> Response A
Connection 2: Request B -> Response B
Connection 3: Request C -> Response C
```

Hình dung HTTP/2:

```txt
One TCP Connection
    ├── Stream A
    ├── Stream B
    ├── Stream C
    └── Stream D
```

HTTP/2 rất quan trọng vì gRPC mặc định chạy trên HTTP/2.

Nhờ HTTP/2, gRPC có thể hỗ trợ:

* Unary call.
* Server streaming.
* Client streaming.
* Bidirectional streaming.
* Multiplexing nhiều call trên một connection.
* Gửi metadata, trailer, status tốt hơn.

Vấn đề còn lại của HTTP/2:

* HTTP/2 vẫn chạy trên TCP.
* Nếu packet bị mất ở tầng TCP, các stream khác vẫn có thể bị ảnh hưởng.
* Đây gọi là TCP-level head-of-line blocking.

---

## 3.5. HTTP/3

HTTP/3 tiếp tục giữ HTTP semantics nhưng thay TCP bằng QUIC.

QUIC chạy trên UDP và tích hợp nhiều cơ chế hiện đại:

* Multiplexing ở tầng transport.
* TLS 1.3 tích hợp sẵn.
* Giảm độ trễ khi thiết lập kết nối.
* Xử lý tốt hơn vấn đề head-of-line blocking ở tầng TCP.
* Phù hợp với môi trường mạng mobile, mạng không ổn định, đổi IP, đổi Wi-Fi/4G.

Hình dung:

```txt
HTTP/1.1  -> HTTP over TCP, text-based
HTTP/2    -> HTTP over TCP, binary framing, multiplexing
HTTP/3    -> HTTP over QUIC/UDP, stream multiplexing tốt hơn
```

Tuy nhiên, trong hệ sinh thái .NET và microservices hiện tại, gRPC ổn định và phổ biến nhất vẫn là gRPC trên HTTP/2. HTTP/3 là hướng rất quan trọng cho web performance, edge, CDN, browser traffic, nhưng không nên hiểu rằng cứ microservices là phải dùng HTTP/3.

---

# 4. REST API là gì?

REST là phong cách thiết kế API dựa trên resource.

Ví dụ ecommerce:

```txt
GET    /api/products
GET    /api/products/{id}
POST   /api/orders
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}
```

REST thường dùng:

* HTTP/1.1 hoặc HTTP/2.
* JSON.
* Status code HTTP.
* Method HTTP: GET, POST, PUT, PATCH, DELETE.
* OpenAPI/Swagger để mô tả API.

Ví dụ response JSON:

```json
{
  "id": "p001",
  "name": "Laptop",
  "price": 1200
}
```

Ưu điểm REST:

* Dễ hiểu.
* Dễ debug bằng browser, Postman, curl.
* Hợp với public API.
* Hợp với frontend web/mobile.
* Hợp với API Gateway.
* Dễ cache với GET.
* Dễ document bằng Swagger/OpenAPI.

Nhược điểm REST:

* JSON text thường lớn hơn binary.
* Không có contract bắt buộc mạnh như `.proto`.
* Client/server dễ lệch kiểu dữ liệu nếu quản lý kém.
* Với service-to-service call nhiều, REST có thể kém tối ưu hơn gRPC.
* Streaming không tự nhiên bằng gRPC.
* Mỗi endpoint thường phải tự thống nhất request/response thủ công.

---

# 5. RPC là gì?

RPC là Remote Procedure Call, nghĩa là gọi hàm từ xa.

Thay vì nghĩ theo resource như REST:

```http
GET /api/products/123
```

RPC nghĩ theo hành động/hàm:

```txt
ProductService.GetProductById(productId)
ProductService.ValidateProducts(items)
OrderService.CreateOrder(command)
InventoryService.ReserveStock(command)
```

Client gọi một method như gọi hàm local, nhưng thực tế request được gửi qua network đến service khác.

Ví dụ:

```txt
Cart Service
    gọi ProductService.ValidateProducts()
        qua network
Product Service
    xử lý validate
    trả kết quả về Cart Service
```

gRPC chính là một framework RPC hiện đại.

---

# 6. gRPC là gì?

gRPC là một framework RPC hiệu năng cao, thường dùng cho giao tiếp service-to-service trong hệ thống phân tán.

gRPC thường gồm 3 thành phần chính:

```txt
.proto file
    ↓
Generate code client/server
    ↓
Service gọi nhau qua HTTP/2 + Protobuf
```

Ví dụ:

```txt
Cart Service  --gRPC-->  Product Service
Order Service --gRPC-->  Inventory Service
Payment       --gRPC-->  Order Service
```

gRPC dùng `.proto` để định nghĩa contract.

Ví dụ:

```proto
syntax = "proto3";

option csharp_namespace = "Ecommerce.Contracts.Products";

service ProductGrpc {
  rpc ValidateProducts (ValidateProductsRequest) returns (ValidateProductsResponse);
}

message ValidateProductsRequest {
  repeated ValidateProductItem items = 1;
}

message ValidateProductItem {
  string id = 1;
  string price = 2;
  int32 quantity = 3;
}

message ValidateProductsResponse {
  repeated ProductValidationResult items = 1;
}

message ProductValidationResult {
  string id = 1;
  bool is_valid = 2;
  string error_code = 3;
  string correct_price = 4;
}
```

Từ file `.proto`, tooling sinh ra code C# client/server.

Client có thể gọi như gọi method:

```csharp
var response = await productGrpcClient.ValidateProductsAsync(request);
```

Server implement method:

```csharp
public override async Task<ValidateProductsResponse> ValidateProducts(
    ValidateProductsRequest request,
    ServerCallContext context)
{
    // validate sản phẩm, giá, tồn kho...
}
```

Điểm hay là client và server dùng chung contract. Nếu `.proto` thay đổi, code generate cũng thay đổi, giúp phát hiện lỗi sớm hơn so với JSON tự do.

---

# 7. Protocol Buffers là gì?

Protocol Buffers, thường gọi là Protobuf, là format serialize dữ liệu dạng binary.

JSON:

```json
{
  "id": "p001",
  "price": 1200,
  "quantity": 2
}
```

Protobuf định nghĩa bằng schema:

```proto
message CartItem {
  string id = 1;
  string price = 2;
  int32 quantity = 3;
}
```

Các số `1`, `2`, `3` là field number. Chúng rất quan trọng vì khi encode binary, Protobuf dùng field number để định danh field.

Ưu điểm Protobuf:

* Nhỏ hơn JSON.
* Encode/decode nhanh.
* Có schema rõ ràng.
* Generate code được.
* Hợp với service-to-service.
* Hợp với hệ thống nhiều ngôn ngữ: C#, Go, Java, Node.js, Python...

Nhược điểm Protobuf:

* Không dễ đọc bằng JSON.
* Debug khó hơn nếu chưa quen.
* Cần tooling.
* Thay đổi contract phải có kỷ luật.

---

# 8. Các kiểu call trong gRPC

gRPC hỗ trợ 4 kiểu call chính.

---

## 8.1. Unary RPC

Một request, một response.

Giống REST nhất.

Ví dụ:

```txt
Cart Service -> Product Service: ValidateProducts(request)
Product Service -> Cart Service: ValidateProductsResponse
```

Proto:

```proto
rpc ValidateProducts (ValidateProductsRequest) returns (ValidateProductsResponse);
```

Dùng khi:

* Validate cart.
* Get product by id.
* Create order.
* Check payment status.
* Get user info.

Đây là kiểu phổ biến nhất.

---

## 8.2. Server Streaming RPC

Client gửi một request, server trả nhiều response theo stream.

Ví dụ:

```proto
rpc GetOrderTracking (OrderTrackingRequest) returns (stream OrderTrackingEvent);
```

Hình dung:

```txt
Client gửi orderId
Server trả:
    Đơn đã xác nhận
    Đang đóng gói
    Đang giao hàng
    Giao thành công
```

Dùng khi:

* Theo dõi trạng thái đơn hàng.
* Log streaming.
* Notification nội bộ.
* Progress xử lý file.

---

## 8.3. Client Streaming RPC

Client gửi nhiều request, server trả một response.

Ví dụ:

```proto
rpc UploadProductImages (stream UploadImageRequest) returns (UploadImageResponse);
```

Hình dung:

```txt
Client gửi nhiều chunk ảnh
Server nhận hết
Server trả kết quả upload
```

Dùng khi:

* Upload file lớn.
* Gửi batch data.
* Gửi telemetry/logs từ client lên server.

---

## 8.4. Bidirectional Streaming RPC

Client và server cùng gửi stream qua lại.

Ví dụ:

```proto
rpc Chat (stream ChatMessage) returns (stream ChatMessage);
```

Dùng khi:

* Chat realtime.
* Game server.
* Realtime collaboration.
* Stream dữ liệu hai chiều giữa service.

Trong microservices ecommerce thông thường, unary RPC đã đủ cho phần lớn use case. Streaming chỉ nên dùng khi thật sự có nhu cầu.

---

# 9. Tại sao chọn gRPC?

## 9.1. Vì gRPC có contract mạnh

REST JSON có thể bị lệch kiểu dữ liệu.

Ví dụ client gửi:

```json
{
  "productId": 123,
  "price": "12.5"
}
```

Server lại kỳ vọng:

```json
{
  "productId": "123",
  "price": 12.5
}
```

Nếu không validate kỹ, lỗi có thể chỉ lộ ra runtime.

Với gRPC, contract nằm trong `.proto`:

```proto
message ValidateProductItem {
  string product_id = 1;
  string price = 2;
  int32 quantity = 3;
}
```

Client/server generate code từ cùng contract, nên ít lệch hơn.

---

## 9.2. Vì gRPC nhanh và nhẹ hơn JSON API trong service-to-service

gRPC dùng Protobuf binary thay vì JSON text.

JSON dễ đọc nhưng có overhead:

```json
{
  "productId": "abc",
  "productName": "Laptop",
  "quantity": 2,
  "unitPrice": 1200
}
```

Protobuf encode thành binary nhỏ hơn, không cần lặp lại key name dài như `"productName"`, `"quantity"`, `"unitPrice"` trong payload.

Trong nội bộ microservices, máy nói chuyện với máy, không cần ưu tiên human-readable như public API. Vì vậy binary format là hợp lý.

---

## 9.3. Vì gRPC dùng HTTP/2

HTTP/2 hỗ trợ multiplexing nhiều stream trên một connection.

Với service-to-service call dày đặc:

```txt
Order -> Product
Order -> Inventory
Order -> Payment
Order -> Promotion
Order -> Shipping
```

Nếu mỗi call đều mở connection riêng hoặc không tối ưu, hệ thống dễ tốn tài nguyên.

gRPC trên HTTP/2 giúp reuse connection tốt hơn, hỗ trợ nhiều call đồng thời trên cùng connection.

---

## 9.4. Vì gRPC hỗ trợ code generation

Từ `.proto`, có thể sinh ra:

* C# client.
* C# server base class.
* Type request/response.
* Method tương ứng service.

Ví dụ client C#:

```csharp
var response = await productClient.ValidateProductsAsync(new ValidateProductsRequest
{
    Items =
    {
        new ValidateProductItem
        {
            Id = productId.ToString(),
            Price = price.ToString("G29", CultureInfo.InvariantCulture),
            Quantity = quantity
        }
    }
});
```

Điều này giúp giảm code thủ công và giảm sai sót.

---

## 9.5. Vì gRPC hợp với microservices nội bộ

Trong microservices, có hai loại giao tiếp chính:

```txt
Client -> API Gateway -> Service
Service -> Service
```

REST rất hợp cho:

```txt
Browser/Mobile -> API Gateway
```

gRPC rất hợp cho:

```txt
Service -> Service
```

Ví dụ trong ecommerce:

```txt
Frontend
    ↓ REST/HTTP JSON
API Gateway / BFF
    ↓ gRPC
Product Service
Cart Service
Order Service
Inventory Service
Payment Service
```

Thiết kế hợp lý:

```txt
Public API: REST/JSON
Internal API: gRPC
Async events: RabbitMQ/Kafka
```

---

## 9.6. Vì gRPC hỗ trợ deadline, cancellation, metadata tốt

Trong hệ thống phân tán, một request không nên chờ vô hạn.

Ví dụ:

```txt
Cart Service gọi Product Service validate cart
Nếu quá 2 giây không trả về -> cancel
```

gRPC hỗ trợ deadline/cancellation khá tự nhiên.

C# client có thể set deadline:

```csharp
var response = await client.ValidateProductsAsync(
    request,
    deadline: DateTime.UtcNow.AddSeconds(2));
```

Điều này rất quan trọng để tránh một service chậm kéo sập dây chuyền các service khác.

---

# 10. Khi nào không nên dùng gRPC?

gRPC mạnh, nhưng không phải thay thế mọi thứ.

Không nên dùng gRPC làm public API chính cho browser thông thường vì browser không gọi gRPC thuần trực tiếp dễ như REST.

Các trường hợp nên cân nhắc REST thay vì gRPC:

* API public cho bên thứ ba.
* API cho frontend web/mobile.
* Cần dễ test bằng browser/Postman/curl.
* Cần Swagger/OpenAPI thân thiện.
* Cần cache HTTP/CDN đơn giản.
* Team chưa quen Protobuf/tooling.
* API thiên về resource CRUD đơn giản.

Các trường hợp nên cân nhắc Message Queue thay vì gRPC:

* Không cần response ngay.
* Cần xử lý bất đồng bộ.
* Cần retry bền vững.
* Cần chống mất message.
* Cần event-driven architecture.

Ví dụ không nên dùng gRPC cho event:

```txt
OrderCreated
PaymentCompleted
InventoryReserved
ProductPriceChanged
```

Các event này nên đi qua RabbitMQ/Kafka hơn là gRPC.

---

# 11. So sánh REST, gRPC, GraphQL, WebSocket, SSE, Message Queue

## 11.1. REST API

Bản chất:

```txt
Resource-based API over HTTP
```

Ví dụ:

```http
GET /api/products/123
POST /api/orders
```

Phù hợp:

* Public API.
* Frontend web/mobile.
* CRUD.
* API Gateway.
* BFF.
* Tích hợp bên thứ ba.

Không tối ưu nhất cho:

* Service-to-service mật độ cao.
* Streaming hai chiều.
* Contract bắt buộc mạnh.

---

## 11.2. gRPC

Bản chất:

```txt
RPC over HTTP/2 + Protobuf
```

Ví dụ:

```txt
ProductService.ValidateProducts()
InventoryService.ReserveStock()
PaymentService.AuthorizePayment()
```

Phù hợp:

* Microservices nội bộ.
* Service-to-service.
* Low latency.
* Contract-first.
* Multi-language.
* Streaming.
* Hệ thống cần performance tốt.

Không tối ưu nhất cho:

* Browser gọi trực tiếp.
* Public API cần dễ đọc.
* Debug thủ công đơn giản.
* API cần cache/CDN kiểu HTTP truyền thống.

---

## 11.3. GraphQL

Bản chất:

```txt
Client query đúng dữ liệu mình cần
```

Ví dụ:

```graphql
query {
  product(id: "123") {
    name
    price
    reviews {
      rating
      comment
    }
  }
}
```

Phù hợp:

* Frontend cần dữ liệu linh hoạt.
* Tránh over-fetching/under-fetching.
* Một màn hình cần gom dữ liệu từ nhiều nguồn.
* BFF layer.

Không tối ưu nhất cho:

* Service-to-service đơn giản.
* Command nghiệp vụ quan trọng.
* Flow cần transaction rõ.
* Team chưa có kinh nghiệm kiểm soát query complexity.

---

## 11.4. WebSocket

Bản chất:

```txt
Kết nối hai chiều lâu dài giữa client và server
```

Phù hợp:

* Chat.
* Game realtime.
* Notification realtime.
* Trading.
* Collaborative editing.
* Live dashboard.

Không nên dùng chỉ để thay REST CRUD thông thường.

---

## 11.5. SSE - Server-Sent Events

Bản chất:

```txt
Server đẩy event một chiều xuống client qua HTTP
```

Phù hợp:

* Notification một chiều.
* Live feed.
* Progress update.
* Dashboard realtime đơn giản.

Khác WebSocket:

```txt
SSE: server -> client
WebSocket: client <-> server
```

---

## 11.6. Message Queue / Event Bus

Ví dụ:

* RabbitMQ.
* Kafka.
* Azure Service Bus.
* Amazon SQS.

Bản chất:

```txt
Service publish message/event
Service khác consume bất đồng bộ
```

Phù hợp:

* Event-driven architecture.
* Retry.
* Decoupling.
* Xử lý nền.
* Giao tiếp không cần phản hồi ngay.
* Tăng độ bền hệ thống.

Ví dụ:

```txt
Order Service publish OrderCreated
Inventory Service consume OrderCreated
Payment Service consume OrderCreated
Notification Service consume OrderCreated
```

Không nên dùng Message Queue nếu client cần response ngay lập tức trong cùng request.

---

# 12. Bảng so sánh nhanh

| Tiêu chí                   | REST/JSON         | gRPC                           | GraphQL                    | WebSocket          | Message Queue      |
| -------------------------- | ----------------- | ------------------------------ | -------------------------- | ------------------ | ------------------ |
| Kiểu giao tiếp             | Request/response  | RPC                            | Query language             | Realtime 2 chiều   | Async event        |
| Format phổ biến            | JSON              | Protobuf                       | JSON                       | Custom/JSON/Binary | JSON/Avro/Protobuf |
| Dễ debug                   | Rất dễ            | Khó hơn                        | Trung bình                 | Khó hơn            | Khó hơn            |
| Browser support            | Rất tốt           | Không trực tiếp nếu gRPC thuần | Tốt                        | Tốt                | Không trực tiếp    |
| Contract                   | OpenAPI, optional | `.proto`, bắt buộc             | Schema                     | Tự định nghĩa      | Message contract   |
| Performance nội bộ         | Tốt               | Rất tốt                        | Trung bình                 | Tốt                | Tốt                |
| Streaming                  | Hạn chế           | Mạnh                           | Không phải thế mạnh        | Rất mạnh           | Theo message       |
| Phù hợp public API         | Rất tốt           | Không phải mặc định            | Tốt nếu cần flexible query | Không cho CRUD     | Không              |
| Phù hợp service-to-service | Ổn                | Rất tốt                        | Không phổ biến             | Ít dùng            | Rất tốt nếu async  |

---

# 13. Nên dùng gì trong hệ thống ecommerce microservices?

Một thiết kế hợp lý:

```txt
Frontend / Mobile
        |
        | REST/JSON
        v
API Gateway / BFF
        |
        | gRPC nội bộ
        v
Product Service
Cart Service
Order Service
Inventory Service
Payment Service
Shipping Service

Event Bus: RabbitMQ/Kafka
        |
        v
OrderCreated, PaymentCompleted, StockReserved, ProductChanged...
```

## Gợi ý cụ thể

### Product Service

Public qua gateway:

```http
GET /api/products
GET /api/products/{id}
```

Internal gRPC:

```txt
ProductGrpc.GetProductSnapshot()
ProductGrpc.ValidateProducts()
```

Event:

```txt
ProductPriceChanged
ProductNameChanged
ProductDeleted
```

---

### Cart Service

Public qua gateway:

```http
GET /api/cart
POST /api/cart/items
PUT /api/cart/items/{id}
DELETE /api/cart/items/{id}
```

Internal gRPC gọi Product:

```txt
ValidateProducts(cartItems)
```

Cart có thể lưu Redis. Khi checkout, Cart gọi Product qua gRPC để validate lại giá, tên, trạng thái bán, tồn kho nếu Product còn giữ stock hoặc gọi Inventory nếu tách stock riêng.

---

### Order Service

Public qua gateway:

```http
POST /api/orders
GET /api/orders/{id}
```

Internal gRPC:

```txt
InventoryGrpc.ReserveStock()
PaymentGrpc.CreatePayment()
ProductGrpc.GetProductSnapshot()
```

Event:

```txt
OrderCreated
OrderCancelled
OrderConfirmed
```

---

### Inventory Service

Internal gRPC:

```txt
ReserveStock()
ReleaseStock()
ConfirmStock()
CheckAvailability()
```

Event:

```txt
StockReserved
StockReservationFailed
StockReleased
```

---

# 14. gRPC và Message Queue khác nhau như nào?

Đây là điểm rất quan trọng.

## gRPC là đồng bộ

Ví dụ:

```txt
Cart Service gọi Product Service validate
Cart Service phải chờ Product Service trả lời
```

Flow:

```txt
Cart -> Product: ValidateProducts
Cart <- Product: Valid/Invalid
```

Dùng khi cần kết quả ngay.

---

## Message Queue là bất đồng bộ

Ví dụ:

```txt
Order Service publish OrderCreated
Inventory Service xử lý sau
Payment Service xử lý sau
Notification Service xử lý sau
```

Flow:

```txt
Order Service -> RabbitMQ: OrderCreated
RabbitMQ -> Inventory Service
RabbitMQ -> Payment Service
RabbitMQ -> Notification Service
```

Order Service không cần gọi trực tiếp từng service trong cùng request.

---

## Quy tắc chọn nhanh

Nếu cần câu trả lời ngay:

```txt
Dùng gRPC hoặc REST
```

Nếu chỉ cần thông báo sự kiện:

```txt
Dùng RabbitMQ/Kafka
```

Nếu giao tiếp nội bộ, cần nhanh, contract chặt:

```txt
Dùng gRPC
```

Nếu giao tiếp với frontend/public:

```txt
Dùng REST/JSON
```

---

# 15. gRPC có liên quan gì đến port, process, service?

Một service backend là một process đang chạy.

Ví dụ:

```txt
Product Service process
    listen port 5001
    expose gRPC endpoint
```

Cart Service muốn gọi Product Service thì cần biết địa chỉ:

```txt
https://product-service:5001
```

Trong Docker Compose:

```yaml
services:
  product-api:
    ports:
      - "5001:8080"

  cart-api:
    depends_on:
      - product-api
```

Trong nội bộ Docker network, Cart có thể gọi:

```txt
http://product-api:8080
```

Port là “cửa” để process nhận request.

Process là chương trình đang chạy.

Service là khái niệm logic/nghiệp vụ.

Ví dụ:

```txt
Product Service = service nghiệp vụ
Product.Api.exe = process chạy service đó
Port 8080 = cổng process đó đang lắng nghe
gRPC endpoint = method được expose qua HTTP/2
```

---

# 16. Ví dụ thực tế: Cart gọi Product bằng gRPC để validate giỏ hàng

## Bài toán

Cart lưu item trong Redis:

```csharp
public class CartItem
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}
```

Nhưng sau đó Product có thể thay đổi:

* Giá đổi.
* Tên đổi.
* Product bị xóa.
* Product ngừng bán.
* Stock không đủ.

Khi checkout, không nên tin hoàn toàn dữ liệu trong cart. Cart cần validate lại với Product/Inventory.

---

## Nếu dùng REST

Cart gọi:

```http
POST /internal/products/validate
Content-Type: application/json
```

Body:

```json
{
  "items": [
    {
      "id": "p001",
      "price": "12.5",
      "quantity": 2
    }
  ]
}
```

Vẫn dùng được, dễ debug, nhưng contract không chặt bằng `.proto`.

---

## Nếu dùng gRPC

Proto:

```proto
syntax = "proto3";

option csharp_namespace = "Ecommerce.Contracts.Products";

service ProductGrpc {
  rpc ValidateProducts (ValidateProductsRequest) returns (ValidateProductsResponse);
}

message ValidateProductsRequest {
  repeated ValidateProductItem items = 1;
}

message ValidateProductItem {
  string id = 1;
  string price = 2;
  int32 quantity = 3;
}

message ValidateProductsResponse {
  repeated ProductValidationResult items = 1;
}

message ProductValidationResult {
  string id = 1;
  ProductValidationError error = 2;
  string current_name = 3;
  string current_price = 4;
  int32 available_quantity = 5;
}

enum ProductValidationError {
  NONE = 0;
  NOT_FOUND = 1;
  PRICE_CHANGED = 2;
  OUT_OF_STOCK = 3;
  INACTIVE = 4;
}
```

Lưu ý: với tiền, không nên dùng `double` nếu cần so sánh chính xác. Có thể dùng `string`, `int64 minor_units`, hoặc custom Decimal message.

Ví dụ:

```proto
message Money {
  int64 units = 1;
  int32 nanos = 2;
}
```

Hoặc đơn giản trong ecommerce Việt Nam:

```proto
message Money {
  int64 amount = 1; // lưu VND dạng số nguyên
}
```

Nếu vẫn muốn lưu decimal dạng text:

```proto
string price = 2;
```

C# parse bằng:

```csharp
decimal.TryParse(
    item.Price,
    NumberStyles.Any,
    CultureInfo.InvariantCulture,
    out var clientPrice);
```

---

# 17. Versioning trong gRPC

Với REST, version thường là:

```txt
/api/v1/products
/api/v2/products
```

Với gRPC, versioning nên quản lý trong `.proto`.

Nguyên tắc:

Không đổi ý nghĩa field cũ.

Không xóa field đang dùng.

Không tái sử dụng field number cũ.

Có thể thêm field mới:

```proto
message Product {
  string id = 1;
  string name = 2;
  string price = 3;
  string brand = 4; // field mới
}
```

Nếu bỏ field, nên reserve:

```proto
message Product {
  reserved 5;
  reserved "old_field_name";
}
```

Điều này tránh client/server cũ bị hiểu sai dữ liệu.

---

# 18. Error handling trong gRPC

gRPC không dùng HTTP status code kiểu REST làm trung tâm. Nó có gRPC status code.

Ví dụ:

* OK
* CANCELLED
* UNKNOWN
* INVALID_ARGUMENT
* DEADLINE_EXCEEDED
* NOT_FOUND
* ALREADY_EXISTS
* PERMISSION_DENIED
* UNAUTHENTICATED
* RESOURCE_EXHAUSTED
* FAILED_PRECONDITION
* INTERNAL
* UNAVAILABLE

Ví dụ C#:

```csharp
throw new RpcException(new Status(
    StatusCode.InvalidArgument,
    "Invalid product id"));
```

Nhưng trong nghiệp vụ validate cart, không nên throw nếu một product invalid. Nên trả lỗi trong response.

Ví dụ tốt:

```proto
message ProductValidationResult {
  string id = 1;
  ProductValidationError error = 2;
}
```

Chỉ throw khi lỗi kỹ thuật:

* Product Service down.
* Database lỗi.
* Request format sai nghiêm trọng.
* Deadline exceeded.
* Unauthorized.

Còn lỗi nghiệp vụ như hết hàng, đổi giá, product ngừng bán thì nên trả về response bình thường.

---

# 19. Security trong gRPC

gRPC có thể dùng:

* TLS.
* JWT Bearer token.
* mTLS giữa service.
* API Gateway/service mesh để kiểm soát nội bộ.
* Metadata để truyền authorization.

Ví dụ metadata:

```csharp
var headers = new Metadata
{
    { "authorization", $"Bearer {token}" }
};

var response = await client.ValidateProductsAsync(request, headers);
```

Trong microservices nội bộ, cần phân biệt:

```txt
User authentication: người dùng là ai?
Service authentication: service nào đang gọi service nào?
Authorization: service/user đó được làm gì?
```

Không nên nghĩ “nội bộ là an toàn tuyệt đối”. Khi hệ thống lớn, service-to-service cũng cần kiểm soát.

---

# 20. gRPC trong .NET

## Server

Cài package thường gặp:

```xml
<PackageReference Include="Grpc.AspNetCore" Version="..." />
```

Program.cs:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddGrpc();

var app = builder.Build();

app.MapGrpcService<ProductGrpcService>();

app.Run();
```

Service:

```csharp
public class ProductGrpcService : ProductGrpc.ProductGrpcBase
{
    public override async Task<ValidateProductsResponse> ValidateProducts(
        ValidateProductsRequest request,
        ServerCallContext context)
    {
        var response = new ValidateProductsResponse();

        foreach (var item in request.Items)
        {
            // validate item
        }

        return response;
    }
}
```

---

## Client

Cài package:

```xml
<PackageReference Include="Grpc.Net.ClientFactory" Version="..." />
<PackageReference Include="Google.Protobuf" Version="..." />
<PackageReference Include="Grpc.Tools" Version="..." PrivateAssets="All" />
```

Đăng ký client:

```csharp
builder.Services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(options =>
{
    options.Address = new Uri("https://product-api:5001");
});
```

Inject vào service:

```csharp
public class CartProductValidator(ProductGrpc.ProductGrpcClient client)
{
    public async Task ValidateAsync()
    {
        var response = await client.ValidateProductsAsync(new ValidateProductsRequest());
    }
}
```

---

# 21. Có nên tạo project BuildingBlocks.Grpc không?

Trong monorepo .NET microservices, có thể tạo project chứa `.proto` hoặc contracts chung.

Ví dụ:

```txt
src/
  BuildingBlocks/
    BuildingBlocks.Grpc/
      Protos/
        products.proto
        inventory.proto
        orders.proto

  Services/
    Products/
      Products.Api/
    Carts/
      Carts.Api/
    Orders/
      Orders.Api/
```

Nhưng cần cẩn thận.

Nếu để quá nhiều contract vào một project chung, các service có thể bị coupling mạnh.

Cách tốt hơn:

```txt
Contracts/
  Products.Grpc.Contracts/
  Inventory.Grpc.Contracts/
  Orders.Grpc.Contracts/
```

Cart Service chỉ reference contract nào nó cần:

```txt
Cart.Api -> Products.Grpc.Contracts
Order.Api -> Inventory.Grpc.Contracts
```

Không nên để mọi service reference một “cục contracts khổng lồ” nếu không cần.

---

# 22. Best practices khi dùng gRPC

## 22.1. Contract-first

Thiết kế `.proto` trước.

Đừng code service trước rồi mới nghĩ proto.

---

## 22.2. Không dùng gRPC cho mọi thứ

Một hệ thống tốt có thể dùng nhiều kiểu giao tiếp:

```txt
REST: frontend/public API
gRPC: service-to-service sync call
RabbitMQ/Kafka: async event
WebSocket/SSE: realtime client update
```

---

## 22.3. Set deadline cho call nội bộ

Không để request chờ vô hạn.

Ví dụ:

```csharp
await client.ValidateProductsAsync(
    request,
    deadline: DateTime.UtcNow.AddSeconds(2));
```

---

## 22.4. Dùng retry có kiểm soát

Không retry bừa mọi call.

Chỉ retry khi operation idempotent hoặc an toàn.

Ví dụ có thể retry:

```txt
GetProductById
ValidateProducts
CheckStock
```

Cẩn thận khi retry:

```txt
CreateOrder
ChargePayment
ReserveStock
```

Với command quan trọng, cần idempotency key.

---

## 22.5. Không throw lỗi nghiệp vụ hàng loạt

Validate cart có 10 sản phẩm, 2 sản phẩm lỗi.

Không nên throw cả request nếu chỉ có vài item invalid.

Nên trả response:

```txt
Item A: OK
Item B: PRICE_CHANGED
Item C: OUT_OF_STOCK
```

---

## 22.6. Không dùng double cho tiền

Protobuf không có decimal native.

Không nên truyền money bằng double nếu cần chính xác.

Nên dùng:

```txt
string decimal text
int64 minor units
custom Money message
```

Ví dụ VND:

```proto
message Money {
  int64 amount = 1;
}
```

Ví dụ USD:

```proto
message Money {
  int64 units = 1;
  int32 nanos = 2;
}
```

---

## 22.7. Chú ý backward compatibility

Không đổi field number.

Không xóa field tùy tiện.

Không đổi ý nghĩa field cũ.

Thêm field mới thì an toàn hơn.

---

# 23. Kết luận chọn công nghệ

Không có công nghệ nào thắng tuyệt đối.

Một kiến trúc thực tế nên chọn theo nhu cầu:

```txt
Frontend gọi backend:
    REST/JSON qua API Gateway

Service gọi service cần kết quả ngay:
    gRPC

Service phát sự kiện cho service khác:
    RabbitMQ/Kafka

Client cần realtime:
    WebSocket hoặc SSE

Frontend cần query dữ liệu linh hoạt:
    GraphQL ở BFF layer
```

Với hệ thống ecommerce microservices .NET, lựa chọn hợp lý là:

```txt
REST/JSON cho public API
gRPC cho internal service-to-service
RabbitMQ/MassTransit cho domain/integration events
Redis cho cache/cart/session
YARP làm API Gateway/BFF
```

Ví dụ flow checkout:

```txt
Frontend
  -> REST POST /api/checkout
API Gateway
  -> Cart Service

Cart Service
  -> gRPC Product Service: ValidateProducts
  -> gRPC Inventory Service: Check/ReserveStock
  -> gRPC Order Service: CreateOrder

Order Service
  -> Publish OrderCreated event

Payment Service
  -> Consume OrderCreated
  -> Process payment
  -> Publish PaymentCompleted/PaymentFailed

Notification Service
  -> Consume events
  -> Send email/push notification
```

Tư duy quan trọng nhất:

```txt
REST để nói chuyện với bên ngoài.
gRPC để service nói chuyện nhanh, chặt contract với nhau.
Message Queue để phát sự kiện bất đồng bộ.
Không dùng một công nghệ để giải quyết mọi bài toán.
```
