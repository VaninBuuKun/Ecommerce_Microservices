import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../service';
import { Terminal } from 'lucide-react';

interface FormValues {
  username: string;
  password:  string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setErrorMsg(null);
    try {
      await authService.login(data.username, data.password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-4xl bg-white border border-brand-border rounded-lg shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left column: Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex flex-col justify-center space-y-6 text-left">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Chào mừng trở lại</h1>
            <p className="text-xs text-brand-muted">Đăng nhập vào hệ thống để tiếp tục mua sắm</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1.5">Email / Username</label>
              <input
                type="text"
                placeholder="m@example.com"
                {...register('username', { required: 'Vui lòng điền Email/Username' })}
                className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
              />
              {errors.username && <span className="text-[10px] text-red-500 mt-1 block">{errors.username.message}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-brand-dark">Mật khẩu</label>
                <a href="#" className="text-xs text-brand-primary hover:underline font-medium">Quên mật khẩu?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Vui lòng điền mật khẩu' })}
                className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
              />
              {errors.password && <span className="text-[10px] text-red-500 mt-1 block">{errors.password.message}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border"></div></div>
            <span className="relative bg-white px-3 text-[10px] text-brand-muted uppercase font-bold tracking-wider">Hoặc tiếp tục với</span>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 py-2 border border-brand-border rounded hover:bg-brand-light-soft text-xs font-bold text-brand-dark cursor-pointer">
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-2 border border-brand-border rounded hover:bg-brand-light-soft text-xs font-bold text-brand-dark cursor-pointer">
              Apple
            </button>
          </div>

          <p className="text-center text-xs text-brand-muted">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-brand-primary hover:underline font-semibold">Đăng ký ngay</Link>
          </p>
        </form>

        {/* Right column: Graphic/Cover page */}
        <div className="hidden md:block bg-brand-dark-surface p-8 relative overflow-hidden flex flex-col justify-between text-left border-l border-brand-border">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl -z-0"></div>
          
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-black text-brand-primary tracking-widest uppercase flex items-center gap-1.5">
              ⚡ SUPABAZE STORE
            </span>
            <h3 className="text-2xl font-black text-white leading-tight tracking-tight">Cửa ngõ dẫn tới bình nguyên vô tận.</h3>
          </div>

          {/* Code block decoration */}
          <div className="relative z-10 rounded border border-brand-dark-lift bg-black/40 p-4 font-mono text-[10px] text-gray-300 space-y-2">
            <span className="text-brand-primary flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> welcome.py</span>
            <p className="text-green-400">print("Chào mừng quay trở lại!")</p>
            <p className="text-gray-500"># Khởi tạo giỏ hàng và đồng bộ session</p>
            <p className="text-brand-primary-soft">init_customer_session(user_id="van_tuong")</p>
          </div>

          <div className="relative z-10 text-[10px] text-brand-muted">
            © 2026 Supabaze Store Inc. Bảo lưu mọi quyền.
          </div>
        </div>

      </div>
    </div>
  );
}
