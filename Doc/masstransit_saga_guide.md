# Hướng dẫn Toàn diện về MassTransit Saga State Machine

Tài liệu này cung cấp kiến thức thực tế về cách tổ chức cấu trúc thư mục và tư tưởng lập trình khi triển khai **Saga State Machine** sử dụng **MassTransit** trong dự án Microservices ASP.NET Core.

---

## 1. Cấu trúc thư mục chuẩn cho Saga

Trong kiến trúc Microservices (Clean Architecture / DDD), **Saga** đóng vai trò điều phối luồng nghiệp vụ liên quan đến nhiều service. Nơi tốt nhất để đặt Saga là ở service làm chủ thể của luồng (ví dụ: `Orders Service`).

Dưới đây là sơ đồ tổ chức thư mục khuyến nghị cho `Orders Service`:

```text
src/
├── Services/
│   ├── Orders/
│   │   ├── Ecommerce.Services.Orders.Contracts/      <-- [Shared Contracts] Chứa các Interface Event/Command
│   │   │   ├── OrderCreatedEvent.cs
│   │   │   ├── ReserveStockCommand.cs
│   │   │   └── StockReservedEvent.cs
│   │   │
│   │   ├── Ecommerce.Services.Orders.Application/    <-- [Application] Chỉ gửi Event đi
│   │   │   └── Features/Orders/Commands/CreateOrder/
│   │   │
│   │   ├── Ecommerce.Services.Orders.Infrastructure/ <-- [Infrastructure] Chứa toàn bộ logic của Saga
│   │   │   ├── Persistence/
│   │   │   │   └── OrderDbContext.cs
│   │   │   └── Sagas/                                <-- [Thư mục Sagas]
│   │   │       ├── OrderState.cs                     (1) Saga State Instance (Lưu DB)
│   │   │       ├── OrderStateMap.cs                  (2) Cấu hình EF Core Mapping
│   │   │       └── OrderStateMachine.cs              (3) Logic điều phối State Machine
```

---

## 2. Giải thích các khái niệm cốt lõi (Tư tưởng Code)

Khi viết code cho Saga State Machine, bạn sẽ làm việc với một ngôn ngữ DSL (Domain Specific Language) do MassTransit cung cấp thông qua các hàm đặc biệt.

### A. Saga Instance (`SagaStateMachineInstance`)
* Là lớp đại diện cho hàng dữ liệu được lưu dưới Database để ghi nhớ trạng thái của giao dịch.
* Phải kế thừa interface `SagaStateMachineInstance`.
* **Bắt buộc** có hai thuộc tính:
  1. `Guid CorrelationId`: Khóa chính (Primary Key). MassTransit dựa vào ID này để biết tin nhắn gửi đến thuộc về đơn hàng nào.
  2. `string CurrentState`: Lưu trữ trạng thái hiện tại (Ví dụ: `"Submitted"`, `"StockReserved"`...).

### B. States (Các trạng thái)
* Đại diện cho các bước trong quy trình.
* Khai báo dưới dạng thuộc tính: `public State Submitted { get; private set; }`.
* MassTransit có sẵn 2 trạng thái mặc định:
  * `Initial`: Trạng thái bắt đầu khi Saga chưa được tạo trong Database.
  * `Final`: Trạng thái kết thúc. Khi chuyển đến trạng thái này, bản ghi Saga có thể tự động xóa khỏi DB để tối ưu bộ nhớ.

### C. Events (Các sự kiện nhận vào)
* Khai báo các sự kiện mà State Machine sẽ lắng nghe để phản ứng lại.
* Khai báo dạng: `public Event<OrderCreatedEvent> OrderCreated { get; private set; }`.

### D. Correlation (Liên kết sự kiện)
* Làm sao Saga biết tin nhắn `StockReservedEvent` (chỉ chứa `OrderId`) thuộc về bản ghi `OrderState` nào trong DB?
* Bạn phải cấu hình liên kết (Correlate) trong Constructor:
  `Event(() => StockReservedEvent, x => x.CorrelateById(context => context.Message.OrderId));`
  *(MassTransit sẽ tìm bản ghi có `CorrelationId` bằng với `OrderId` nhận được).*

---

## 3. Các từ khóa DSL và Tư tưởng Lập trình

Bên trong Constructor của lớp kế thừa `MassTransitStateMachine<TState>`, bạn sẽ sử dụng các từ khóa sau để thiết lập luồng đi:

### 1. `Initially(...)` (Khởi tạo)
* Định nghĩa hành vi khi Saga đang ở trạng thái sơ khai (`Initial`) và nhận được sự kiện mở đầu.
* Sự kiện này sẽ tự động **tạo mới một bản ghi** dưới database.
* **Tư tưởng code:** Chỉ dùng cho sự kiện kích hoạt đầu tiên (Ví dụ: `OrderCreated`).

```csharp
Initially(
    When(OrderCreated)
        .Then(context => {
            // Copy thông tin từ tin nhắn vào DB để lưu lại
            context.Saga.OrderId = context.Message.Id;
            context.Saga.CustomerId = context.Message.CustomerId;
        })
        .TransitionTo(Submitted) // Chuyển sang trạng thái tiếp theo
);
```

### 2. `During(State, ...)` (Trong lúc đang ở trạng thái X)
* Ràng buộc hành vi: Chỉ khi hệ thống đang ở trạng thái `State` thì mới xử lý sự kiện bên trong.
* **Tư tưởng code:** Giúp ngăn chặn lỗi xử lý sai trình tự. Ví dụ: Nếu chưa tạo đơn (`Initial`) mà có sự kiện thanh toán thành công gửi đến, hệ thống sẽ bỏ qua không xử lý bậy bạ.

```csharp
During(Submitted,
    When(StockReservedEvent)
        .Then(context => /* xử lý */)
        .TransitionTo(StockReserved)
);
```

### 3. `When(...)` (Khi nhận được sự kiện)
* Bắt đầu một chuỗi hành động khi có sự kiện khớp.

### 4. `Then(...)` (Thì thực hiện lệnh C#)
* Cho phép bạn viết code C# tùy ý trực tiếp.
* **Tư tưởng code:** Chỉ dùng để cập nhật dữ liệu của Saga Instance (`context.Saga.Property = ...`) hoặc ghi log. Không nên gọi Database trực tiếp hay viết logic nặng ở đây.

### 5. `Publish` hoặc `Send` (Bắn tin nhắn đi)
* `.Publish(...)`: Phát tán một Event ra toàn hệ thống (nhiều service khác cùng nhận được).
* `.Send(...)`: Gửi trực tiếp một **Mệnh lệnh (Command)** tới đích danh một hàng đợi (Queue) của một service cụ thể xử lý (Ví dụ: gửi lệnh Trừ kho tới `Catalogs Service`).

### 6. `TransitionTo(...)` (Chuyển đổi trạng thái)
* Chuyển trạng thái hiện tại của Saga (`CurrentState`) sang trạng thái mới.

### 7. `Finalize()` và `RemoveWhenFinalized()`
* Kết thúc Saga.
* Nếu cấu hình `.RemoveWhenFinalized()`, MassTransit sẽ tự động chạy lệnh `DELETE` xóa bản ghi Saga này trong DB khi nó đạt trạng thái `Final` để tránh bảng bị phình to theo thời gian.

---

## 4. Code mẫu hoàn chỉnh một Saga State Machine

Dưới đây là mã nguồn mẫu cấu trúc lớp State Machine:

```csharp
using MassTransit;
using Ecommerce.Services.Orders.Contracts;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class OrderStateMachine : MassTransitStateMachine<OrderState>
{
    // Các trạng thái
    public State Submitted { get; private set; }
    public State StockReserved { get; private set; }
    public State Failed { get; private set; }

    // Các sự kiện lắng nghe
    public Event<OrderCreatedEvent> OrderCreated { get; private set; }
    public Event<StockReservedEvent> StockReservedEvent { get; private set; }
    public Event<StockReservationFailedEvent> StockReservationFailed { get; private set; }

    public OrderStateMachine()
    {
        // 1. Chỉ định cột lưu trạng thái
        InstanceState(x => x.CurrentState);

        // 2. Cấu hình liên kết ID tin nhắn với CorrelationId của Saga
        Event(() => OrderCreated, x => x.CorrelateById(context => context.Message.Id));
        Event(() => StockReservedEvent, x => x.CorrelateById(context => context.Message.OrderId));
        Event(() => StockReservationFailed, x => x.CorrelateById(context => context.Message.OrderId));

        // 3. Định nghĩa luồng
        Initially(
            When(OrderCreated)
                .Then(context =>
                {
                    context.Saga.OrderId = context.Message.Id;
                    context.Saga.CustomerId = context.Message.CustomerId;
                    context.Saga.TotalPrice = context.Message.TotalPrice;
                })
                // Gửi lệnh sang kho yêu cầu giữ hàng
                .Send(new Uri("queue:reserve-stock-queue"), context => new ReserveStockCommand
                {
                    OrderId = context.Saga.OrderId
                })
                .TransitionTo(Submitted)
        );

        During(Submitted,
            When(StockReservedEvent)
                .TransitionTo(StockReserved)
                .Then(context => 
                {
                    // Tiếp tục luồng thanh toán...
                }),

            When(StockReservationFailed)
                .TransitionTo(Failed)
                .Then(context =>
                {
                    // Thực hiện hành động bù: Hủy đơn hàng ở DB
                })
                .Finalize() // Chuyển sang trạng thái kết thúc
        );

        // Tự động xóa bản ghi khỏi Database khi hoàn tất/hủy bỏ thành công
        SetCompletedWhenFinalized();
    }
}
```
