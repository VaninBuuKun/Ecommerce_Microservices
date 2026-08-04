import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

export default function CartPage() {
  const dummyItems = [
    { id: 1, name: 'Áo Hoodie Casual Cam Nhạt', price: 450000, quantity: 1, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' },
    { id: 2, name: 'Quần Cargo Đen Slimfit', price: 520000, quantity: 2, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400' },
  ];

  const subTotal = dummyItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua sắm
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-brand-dark text-left mb-8 flex items-center gap-2">
        <ShoppingCart className="w-8 h-8 text-brand-primary" />
        Giỏ hàng của bạn
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items List */}
        <div className="flex-1 space-y-4">
          {dummyItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-brand-border rounded-2xl">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl border border-brand-border" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-brand-dark">{item.name}</h3>
                <span className="text-brand-primary font-bold text-sm">{(item.price).toLocaleString('vi-VN')}đ</span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-brand-muted">Số lượng:</span>
                  <span className="text-sm font-semibold">{item.quantity}</span>
                </div>
              </div>
              <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="w-full lg:w-80 p-6 bg-white border border-brand-border rounded-2xl h-fit space-y-6 text-left">
          <h2 className="text-xl font-bold text-brand-dark pb-4 border-b border-brand-border">Tóm tắt đơn hàng</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-brand-muted text-sm">
              <span>Tạm tính</span>
              <span className="font-semibold text-brand-dark">{subTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-brand-muted text-sm">
              <span>Phí vận chuyển</span>
              <span className="text-green-600 font-semibold">Miễn phí</span>
            </div>
          </div>

          <div className="border-t border-brand-border pt-4 flex justify-between font-bold text-brand-dark">
            <span>Tổng cộng</span>
            <span className="text-brand-primary text-xl">{subTotal.toLocaleString('vi-VN')}đ</span>
          </div>

          <Link
            to="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-medium rounded-full hover:bg-opacity-95 transition-all text-center group"
          >
            Tiến hành đặt hàng
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
