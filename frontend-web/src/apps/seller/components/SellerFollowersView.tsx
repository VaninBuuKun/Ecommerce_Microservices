import { useState, useMemo } from "react";
import {
	Users,
	Search,
	Calendar,
	UserCheck,
	TrendingUp,
	Eye,
	X,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CommentOutlined } from "@ant-design/icons";
import { OrdersView } from "@/domains/order";

interface FollowerItem {
	id: string;
	userId: number;
	name: string;
	avatar: string;
	followedAt: string; // DD/MM/YYYY
	followedDateObj: Date;
	isNew: boolean;
	lastActive: string;
}

// Danh sách người theo dõi mẫu
const MOCK_FOLLOWERS: FollowerItem[] = [
	{
		id: "fol-1",
		userId: 101,
		name: "Nguyễn Văn An",
		avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
		followedAt: "08/09/2026",
		followedDateObj: new Date(2026, 8, 8),
		isNew: true,
		lastActive: "15 phút trước",
	},
	{
		id: "fol-2",
		userId: 102,
		name: "Trần Hoàng Bách",
		avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
		followedAt: "05/09/2026",
		followedDateObj: new Date(2026, 8, 5),
		isNew: true,
		lastActive: "1 giờ trước",
	},
	{
		id: "fol-3",
		userId: 103,
		name: "Phạm Thùy Trang",
		avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
		followedAt: "28/08/2026",
		followedDateObj: new Date(2026, 7, 28),
		isNew: false,
		lastActive: "Hôm qua",
	},
	{
		id: "fol-4",
		userId: 104,
		name: "Vũ Quốc Anh",
		avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
		followedAt: "20/08/2026",
		followedDateObj: new Date(2026, 7, 20),
		isNew: false,
		lastActive: "3 ngày trước",
	},
	{
		id: "fol-5",
		userId: 105,
		name: "Lê Minh Tuấn",
		avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
		followedAt: "15/08/2026",
		followedDateObj: new Date(2026, 7, 15),
		isNew: false,
		lastActive: "Vừa xong",
	},
	{
		id: "fol-6",
		userId: 106,
		name: "Đỗ Thị Mai",
		avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
		followedAt: "02/08/2026",
		followedDateObj: new Date(2026, 7, 2),
		isNew: false,
		lastActive: "5 ngày trước",
	},
	{
		id: "fol-7",
		userId: 107,
		name: "Hoàng Đức Duy",
		avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
		followedAt: "25/07/2026",
		followedDateObj: new Date(2026, 6, 25),
		isNew: false,
		lastActive: "Hôm nay",
	},
	{
		id: "fol-8",
		userId: 108,
		name: "Bùi Thu Hà",
		avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
		followedAt: "10/07/2026",
		followedDateObj: new Date(2026, 6, 10),
		isNew: false,
		lastActive: "1 tuần trước",
	},
];

export function SellerFollowersView() {
	const navigate = useNavigate();

	// Khách hàng đang được chọn để xem chi tiết đơn hàng (Tái sử dụng OrdersView có customerId, không dùng Modal)
	const [selectedFollower, setSelectedFollower] = useState<FollowerItem | null>(null);

	// Tìm kiếm & Bộ lọc thời gian
	const [searchKeyword, setSearchKeyword] = useState("");
	const [startDateFilter, setStartDateFilter] = useState(""); // YYYY-MM-DD

	// Phân trang
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 5;

	// Xử lý bộ lọc nhanh 7 ngày / 30 ngày
	const handleQuickFilter = (days: number) => {
		const targetDate = new Date();
		targetDate.setDate(targetDate.getDate() - days);
		const yyyy = targetDate.getFullYear();
		const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
		const dd = String(targetDate.getDate()).padStart(2, "0");
		setStartDateFilter(`${yyyy}-${mm}-${dd}`);
		setCurrentPage(1);
	};

	// Lọc danh sách người theo dõi
	const filteredFollowers = useMemo(() => {
		return MOCK_FOLLOWERS.filter((f) => {
			// Lọc theo ngày bắt đầu (từ ngày đã chọn đến hiện tại)
			if (startDateFilter) {
				const filterDate = new Date(startDateFilter);
				filterDate.setHours(0, 0, 0, 0);
				const followerDate = new Date(f.followedDateObj);
				followerDate.setHours(0, 0, 0, 0);
				if (followerDate < filterDate) return false;
			}

			// Lọc theo từ khóa (Tên khách hàng hoặc ID)
			if (searchKeyword.trim()) {
				const kw = searchKeyword.toLowerCase().trim();
				const matchName = f.name.toLowerCase().includes(kw);
				const matchId = String(f.userId).includes(kw);
				if (!matchName && !matchId) return false;
			}
			return true;
		});
	}, [searchKeyword, startDateFilter]);

	// Phân trang
	const totalPages = Math.ceil(filteredFollowers.length / pageSize) || 1;
	const paginatedFollowers = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredFollowers.slice(start, start + pageSize);
	}, [filteredFollowers, currentPage, pageSize]);

	// Nếu đang chọn xem chi tiết đơn hàng của một follower -> Render OrdersView tái sử dụng
	if (selectedFollower) {
		return (
			<div className="space-y-4 text-left font-sans animate-in fade-in duration-300">
				<OrdersView
					customerId={selectedFollower.userId}
					onBack={() => setSelectedFollower(null)}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Header chuẩn phong cách các trang Seller */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-xl font-bold text-brand-dark mb-1">
						Khách Hàng Theo Dõi Cửa Hàng
					</h1>
					<p className="text-xs text-brand-muted">
						Danh sách khách hàng đang theo dõi shop và cập nhật sản phẩm mới
					</p>
				</div>
			</div>

			{/* 2 Thẻ chỉ số KPI (Đã bỏ mục Tỷ lệ tương tác theo yêu cầu, dùng hoàn toàn rounded-md) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Người Theo Dõi
						</span>
						<div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
							<Users className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">1,350 người</div>
					<p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
						<TrendingUp className="w-3 h-3" /> +28 người theo dõi tuần này
					</p>
				</div>

				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Mới Theo Dõi (30 ngày)
						</span>
						<div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
							<UserCheck className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-emerald-600">42 người</div>
					<p className="text-[10px] text-brand-muted font-medium">Tăng trưởng ổn định</p>
				</div>
			</div>

			{/* Thanh tìm kiếm & Bộ lọc thời gian (Cuốn lịch từ quá khứ đến hiện tại) */}
			<div className="bg-white border border-brand-border rounded-md p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
				{/* Ô tìm kiếm theo tên hoặc ID */}
				<div className="flex items-center gap-2.5 flex-1 max-w-md">
					<Search className="w-4 h-4 text-brand-muted shrink-0" />
					<input
						type="text"
						value={searchKeyword}
						onChange={(e) => {
							setSearchKeyword(e.target.value);
							setCurrentPage(1);
						}}
						placeholder="Tìm theo tên khách hàng hoặc ID (#101)..."
						className="w-full text-xs font-medium text-brand-dark focus:outline-none bg-transparent"
					/>
				</div>

				{/* Bộ chọn thời gian: cuốn lịch + nút chọn nhanh */}
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => {
							setStartDateFilter("");
							setCurrentPage(1);
						}}
						className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
							!startDateFilter
								? "bg-brand-dark text-white border-brand-dark shadow-xs"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
						}`}
					>
						Tất cả
					</button>

					<button
						type="button"
						onClick={() => handleQuickFilter(7)}
						className="px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
					>
						7 ngày qua
					</button>

					{/* Date picker (Cuốn lịch) chọn thời điểm trong quá khứ */}
					<div className="flex items-center gap-1.5 bg-slate-50 border border-brand-border rounded-md px-2.5 py-1 text-xs">
						<Calendar className="w-3.5 h-3.5 text-brand-muted shrink-0" />
						<span className="text-[11px] text-brand-muted font-semibold whitespace-nowrap">Từ ngày:</span>
						<input
							type="date"
							value={startDateFilter}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => {
								setStartDateFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="text-xs bg-transparent text-brand-dark font-medium focus:outline-none cursor-pointer"
						/>
						{startDateFilter && (
							<span className="text-[10px] text-brand-muted font-bold whitespace-nowrap">đến nay</span>
						)}
						{startDateFilter && (
							<button
								type="button"
								onClick={() => {
									setStartDateFilter("");
									setCurrentPage(1);
								}}
								className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
								title="Xóa bộ lọc ngày"
							>
								<X className="w-3 h-3" />
							</button>
						)}
					</div>
				</div>
			</div>

			{/* BẢNG DANH SÁCH FOLLOWERS (rounded-md, Header đồng bộ với ProductTable) */}
			<div className="bg-white border border-brand-border rounded-md shadow-xs overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="border-b border-brand-border bg-brand-light-soft/50 text-brand-muted font-bold text-xs">
								<th className="py-3 px-4">Khách hàng</th>
								<th className="py-3 px-4">Ngày theo dõi</th>
								<th className="py-3 px-4">Hoạt động gần nhất</th>
								<th className="py-3 px-4 text-right">Thao tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 font-normal">
							{paginatedFollowers.length === 0 ? (
								<tr>
									<td colSpan={4} className="py-8 text-center text-xs text-brand-muted">
										Không tìm thấy người theo dõi nào phù hợp với bộ lọc.
									</td>
								</tr>
							) : (
								paginatedFollowers.map((follower) => (
									<tr key={follower.id} className="hover:bg-slate-50 transition-colors">
										{/* Cột 1: Thông tin khách hàng (Hiển thị ID chứ không hiển thị email/username) */}
										<td className="py-3 px-4">
											<div className="flex items-center gap-3">
												<img
													src={follower.avatar}
													alt={follower.name}
													className="w-9 h-9 rounded-full object-cover border border-brand-border shrink-0"
												/>
												<div>
													<div className="flex items-center gap-1.5">
														<span className="font-bold text-brand-dark">{follower.name}</span>
														{follower.isNew && (
															<span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
																Mới
															</span>
														)}
													</div>
													{/* Hiển thị ID khách hàng */}
													<span className="text-[10px] text-brand-muted block font-mono font-semibold">
														ID: #{follower.userId}
													</span>
												</div>
											</div>
										</td>

										{/* Cột 2: Ngày theo dõi */}
										<td className="py-3 px-4 text-slate-600 font-medium">
											<div className="flex items-center gap-1.5">
												<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
												<span>{follower.followedAt}</span>
											</div>
										</td>

										{/* Cột 3: Trạng thái hoạt động */}
										<td className="py-3 px-4">
											<div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
												<span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
												<span>{follower.lastActive}</span>
											</div>
										</td>

										{/* Cột 4: Nút thao tác (Xem chi tiết đơn bằng OrdersView & Nhắn tin) */}
										<td className="py-3 px-4 text-right">
											<div className="flex items-center justify-end gap-2">
												{/* Nút Xem chi tiết đơn: chuyển sang xem OrdersView có filter customerId */}
												<button
													type="button"
													onClick={() => setSelectedFollower(follower)}
													className="px-2.5 py-1.5 rounded-md border border-brand-border bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
												>
													<Eye className="w-3.5 h-3.5 text-slate-500" />
													<span>Xem chi tiết đơn</span>
												</button>

												{/* Nút Nhắn tin */}
												<button
													type="button"
													onClick={() => navigate("/chat?seller=true")}
													className="px-2.5 py-1.5 rounded-md bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary-deep text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
												>
													<CommentOutlined style={{ fontSize: "14px" }} className="text-brand-muted" />
													<span>Nhắn tin</span>
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Phân trang */}
				{totalPages > 1 && (
					<div className="p-3 border-t border-brand-border flex items-center justify-between">
						<span className="text-[11px] text-brand-muted">
							Hiển thị {paginatedFollowers.length} / {filteredFollowers.length} người theo dõi
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								className="p-1 rounded-md border border-brand-border bg-white text-xs text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="text-xs font-bold text-brand-dark px-2">
								{currentPage} / {totalPages}
							</span>
							<button
								type="button"
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
								className="p-1 rounded-md border border-brand-border bg-white text-xs text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default SellerFollowersView;
