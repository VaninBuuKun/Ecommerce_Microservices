import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function CheckoutPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-extrabold text-brand-dark mb-2">Đặt Hàng Thành Công!</h1>
        <p className="text-brand-muted mb-8">Cảm ơn bạn đã mua sắm. Mã đơn hàng của bạn đã được chuyển cho hệ thống xử lý.</p>
        <Link to="/" className="px-6 py-2.5 bg-brand-primary text-white rounded-full font-medium hover:bg-opacity-95 transition-all">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-3xl mx-auto w-full text-left">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-brand-dark mb-8 flex items-center gap-2">
        <CreditCard className="w-8 h-8 text-brand-primary" />
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery Details */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-dark pb-3 border-b border-brand-border">Thông tin nhận hàng</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1">Họ và tên</label>
              <input type="text" defaultValue="Nguyễn Văn A" className="w-full px-4 py-2 bg-white border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1">Số điện thoại</label>
              <input type="text" defaultValue="0987654321" className="w-full px-4 py-2 bg-white border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1">Địa chỉ giao hàng</label>
              <input type="text" defaultValue="123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. HCM" className="w-full px-4 py-2 bg-white border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary text-sm" />
            </div>
          </div>
        </div>

        {/* Payment Methods & CTA */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-dark pb-3 border-b border-brand-border">Phương thức thanh toán</h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-white border border-brand-primary rounded-2xl cursor-pointer">
              <input type="radio" name="payment" defaultChecked className="accent-brand-primary" />
              <div>
                <span className="font-bold text-brand-dark text-sm block">Ví Momo Sandbox</span>
                <span className="text-xs text-brand-muted">Thanh toán quét mã qua ví điện tử</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 bg-white border border-brand-border rounded-2xl cursor-pointer hover:border-brand-primary transition-colors">
              <input type="radio" name="payment" className="accent-brand-primary" />
              <div>
                <span className="font-bold text-brand-dark text-sm block">Cổng VNPay Sandbox</span>
                <span className="text-xs text-brand-muted">Thanh toán qua tài khoản ngân hàng</span>
              </div>
            </label>
          </div>

          <button
            onClick={() => setIsSuccess(true)}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-full hover:bg-opacity-95 transition-all text-center mt-6"
          >
            Xác nhận Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
