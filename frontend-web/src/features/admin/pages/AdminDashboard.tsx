import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import api from "../../../shared/lib/axios";
import { Loader2, AlertTriangle, ShieldCheck, UserCheck, Eye, RefreshCw, FolderOpen } from "lucide-react";
import { getOrderStatusBadge } from "../../order/utils/statusHelper";

// 1. QUẢN LÝ SẢN PHẨM (Products View)
function AdminProductsView() {
	const [products, setProducts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await api.get("/products");
			const items = response.data?.value?.items || response.data?.items || response.data || [];
			setProducts(items);
		} catch (err) {
			console.error("Lỗi khi tải sản phẩm", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý sản phẩm hệ thống</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách toàn bộ các sản phẩm đã đăng ký của các shop trên sàn</p>
				</div>
				<button onClick={fetchProducts} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách sản phẩm...
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có sản phẩm nào trên hệ thống.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-2/5">Sản phẩm</th>
								<th className="p-3 w-1/5">Mã SKU</th>
								<th className="p-3 w-1/5">Giá bán</th>
								<th className="p-3 text-center w-1/10">Trạng thái</th>
								<th className="p-3 text-center w-1/10">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{products.map((p: any) => (
								<tr key={p.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3">
										<div className="flex items-center gap-3">
											<img 
												src={p.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"} 
												alt={p.name} 
												className="w-10 h-10 rounded object-cover border border-brand-border" 
												onError={(e) => {
													(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150";
												}}
											/>
											<div>
												<p className="font-bold text-brand-dark text-xs">{p.name}</p>
												<p className="text-[10px] text-brand-muted font-semibold mt-0.5">Shop ID: {p.shopId}</p>
											</div>
										</div>
									</td>
									<td className="p-3 font-mono font-bold text-brand-muted">{p.id.split("-")[0].toUpperCase()}</td>
									<td className="p-3 font-black text-brand-dark">{Number(p.price || 0).toLocaleString("vi-VN")}đ</td>
									<td className="p-3 text-center">
										<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
											{p.status === "Active" ? "Hoạt động" : "Tạm ẩn"}
										</span>
									</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// 2. QUẢN LÝ ĐƠN HÀNG (Orders View)
function AdminOrdersView() {
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const response = await api.get("/v1/orders/customer/1"); 
			const items = response.data?.value || response.data || [];
			setOrders(items);
		} catch (err) {
			console.error("Lỗi khi tải đơn hàng", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý đơn hàng toàn sàn</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các hóa đơn mua sắm và trạng thái xử lý vận chuyển</p>
				</div>
				<button onClick={fetchOrders} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách đơn hàng...
					</div>
				) : orders.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có đơn hàng nào trên hệ thống.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/4">Mã đơn con</th>
								<th className="p-3 w-1/4">Cửa hàng</th>
								<th className="p-3 w-1/4 text-right">Tổng giá trị</th>
								<th className="p-3 text-center w-1/6">Trạng thái</th>
								<th className="p-3 text-center w-1/12">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{orders.map((o: any) => (
								<tr key={o.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-mono font-bold text-brand-dark">#{o.id.split("-")[0].toUpperCase()}</td>
									<td className="p-3 text-brand-dark font-extrabold">{o.shopName || "Cửa hàng"}</td>
									<td className="p-3 text-right font-black text-brand-dark">{Number(o.grandTotal).toLocaleString("vi-VN")}đ</td>
									<td className="p-3 text-center">{getOrderStatusBadge(o.status)}</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// 3. YÊU CẦU HOÀN TIỀN (Refund Requests)
function AdminRefundsView() {
	const [refunds, setRefunds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchRefunds = async () => {
		try {
			setLoading(true);
			const response = await api.get("/v1/refunds/my-requests"); 
			const items = response.data?.value || response.data || [];
			setRefunds(items);
		} catch (err) {
			console.error("Lỗi khi tải danh sách hoàn tiền", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRefunds();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Yêu cầu hoàn trả & hoàn tiền</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các yêu cầu khiếu nại hoàn trả hàng của khách hàng gửi cho shop</p>
				</div>
				<button onClick={fetchRefunds} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách khiếu nại...
					</div>
				) : refunds.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có yêu cầu hoàn tiền nào trên hệ thống.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/4">Mã đơn con</th>
								<th className="p-3 w-2/5">Lý do hoàn tiền</th>
								<th className="p-3 text-right w-1/5">Số tiền</th>
								<th className="p-3 text-center w-1/6">Trạng thái</th>
								<th className="p-3 text-center w-1/12">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{refunds.map((r: any) => (
								<tr key={r.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-mono font-bold text-brand-dark">#{r.subOrderId.split("-")[0].toUpperCase()}</td>
									<td className="p-3 text-brand-dark font-semibold">{r.reason}</td>
									<td className="p-3 text-right font-black text-brand-dark">{Number(r.refundAmount).toLocaleString("vi-VN")}đ</td>
									<td className="p-3 text-center">
										<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.status === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : r.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
											{r.status === "Pending" ? "Chờ duyệt" : r.status === "Approved" ? "Chấp nhận" : "Từ chối"}
										</span>
									</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// 4. QUẢN LÝ CATEGORY (Category View as Tree structure with CRUD Modals)
interface CategoryNode {
	id: any;
	name: string;
	parentId?: any;
	description?: string;
	children: CategoryNode[];
}

function CategoryTreeItem({ 
	node, 
	depth = 0,
	onEdit,
	onDelete
}: { 
	node: CategoryNode; 
	depth: number;
	onEdit: (category: any) => void;
	onDelete: (id: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(true);
	const hasChildren = node.children && node.children.length > 0;

	return (
		<div className="space-y-1">
			<div 
				className="flex items-center justify-between py-2 px-4 hover:bg-brand-light-soft/50 rounded-lg transition-all text-xs font-bold text-brand-dark"
				style={{ paddingLeft: `${depth * 24 + 16}px` }}
			>
				<div className="flex items-center gap-2.5">
					{hasChildren ? (
						<button 
							onClick={() => setIsOpen(!isOpen)} 
							className="p-1 hover:bg-brand-border rounded cursor-pointer transition-colors text-brand-muted hover:text-brand-dark"
						>
							<span className="text-[10px] block transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
								▶
							</span>
						</button>
					) : (
						<span className="w-6 h-6 block shrink-0" />
					)}
					<FolderOpen className="w-4 h-4 text-brand-muted shrink-0" />
					<span className="font-extrabold text-brand-dark">{node.name}</span>
				</div>
				<div className="flex items-center gap-6 text-brand-muted text-[10px] font-bold">
					<span className="font-mono">ID: {String(node.id).split("-")[0].toUpperCase()}</span>
					<div className="flex items-center gap-2 w-28 justify-end">
						<button 
							onClick={() => onEdit(node)}
							className="px-2 py-1 bg-brand-light-soft text-brand-primary-deep hover:bg-brand-primary/10 rounded font-black transition-colors cursor-pointer text-[9px]"
						>
							Sửa
						</button>
						<button 
							onClick={() => onDelete(node.id)}
							className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-black transition-colors cursor-pointer text-[9px]"
						>
							Xóa
						</button>
					</div>
				</div>
			</div>
			{hasChildren && isOpen && (
				<div className="space-y-0.5">
					{node.children.map((child) => (
						<CategoryTreeItem 
							key={child.id} 
							node={child} 
							depth={depth + 1} 
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function AdminCategoriesView() {
	const [categories, setCategories] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	
	// State cho Modals
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "update">("create");
	const [selectedCategory, setSelectedCategory] = useState<any>(null);
	
	// Form States
	const [formName, setFormName] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formParentId, setFormParentId] = useState("");

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const response = await api.get("/categories");
			const items = response.data?.value || response.data || [];
			setCategories(items);
		} catch (err) {
			console.error("Lỗi khi tải danh mục", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	// Hàm mở modal để thêm mới
	const handleOpenCreateModal = () => {
		setModalMode("create");
		setSelectedCategory(null);
		setFormName("");
		setFormDescription("");
		setFormParentId("");
		setIsModalOpen(true);
	};

	// Hàm mở modal để cập nhật
	const handleOpenUpdateModal = (cat: any) => {
		setModalMode("update");
		setSelectedCategory(cat);
		setFormName(cat.name);
		setFormDescription(cat.description || "");
		setFormParentId(cat.parentId || "");
		setIsModalOpen(true);
	};

	// Xử lý nộp Form (Thêm hoặc Sửa)
	const handleSaveCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const payload = {
				name: formName,
				description: formDescription,
				parentId: formParentId === "" ? null : formParentId,
				iconUrl: null
			};

			if (modalMode === "create") {
				await api.post("/categories", payload);
			} else {
				await api.put(`/categories/${selectedCategory.id}`, payload);
			}
			
			setIsModalOpen(false);
			fetchCategories();
		} catch (err: any) {
			alert("Thao tác thất bại: " + (err.response?.data || err.message));
		}
	};

	// Xử lý Xóa category
	const handleDeleteCategory = async (id: string) => {
		if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) return;
		try {
			await api.delete(`/categories/${id}`);
			fetchCategories();
		} catch (err: any) {
			alert("Xóa thất bại: " + (err.response?.data || err.message));
		}
	};

	// Hàm chuyển đổi dữ liệu Category thành cấu trúc Tree chuẩn
	const buildCategoryTree = (data: any[]): CategoryNode[] => {
		const mapNode = (item: any): CategoryNode => {
			return {
				id: item.id,
				name: item.name,
				parentId: item.parentId,
				description: item.description,
				children: (item.subCategories || item.children || []).map((sub: any) => mapNode(sub))
			};
		};

		const isNested = data.some(item => (item.subCategories && item.subCategories.length > 0) || (item.children && item.children.length > 0));
		if (isNested) {
			const roots = data.filter(item => !item.parentId || item.parentId === "00000000-0000-0000-0000-000000000000");
			const source = roots.length > 0 ? roots : data;
			return source.map(item => mapNode(item));
		}

		const map: Record<string, CategoryNode> = {};
		const roots: CategoryNode[] = [];

		data.forEach((item) => {
			map[String(item.id)] = {
				id: item.id,
				name: item.name,
				parentId: item.parentId,
				description: item.description,
				children: [],
			};
		});

		data.forEach((item) => {
			const node = map[String(item.id)];
			const pId = item.parentId;
			const hasParent = pId && pId !== "00000000-0000-0000-0000-000000000000" && map[String(pId)];
			if (hasParent) {
				map[String(pId)].children.push(node);
			} else {
				roots.push(node);
			}
		});

		return roots;
	};

	const categoryTree = buildCategoryTree(categories);

	// Lọc danh sách danh mục làm cha (chỉ lấy level 1 - root categories không có parentId)
	const rootCategoriesForSelect = categories.filter(
		(cat: any) => !cat.parentId || cat.parentId === "00000000-0000-0000-0000-000000000000"
	);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Danh mục sản phẩm hệ thống</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Cơ cấu cây phân cấp các ngành hàng và danh mục sản phẩm của toàn hệ thống</p>
				</div>
				<div className="flex items-center gap-2">
					<button 
						onClick={handleOpenCreateModal}
						className="px-3 py-1.5 bg-brand-primary text-white hover:bg-opacity-95 rounded text-[11px] font-black tracking-wide transition-colors cursor-pointer"
					>
						+ Thêm danh mục
					</button>
					<button onClick={fetchCategories} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				<div className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider p-3 flex justify-between select-none">
					<span>Cơ cấu danh mục (Tree view)</span>
					<div className="flex items-center gap-12 mr-6">
						<span>Mã danh mục</span>
						<span className="w-28 text-right pr-4">Hành động</span>
					</div>
				</div>

				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang dựng cây danh mục...
					</div>
				) : categoryTree.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Chưa có danh mục sản phẩm nào được tạo.</div>
				) : (
					<div className="p-2 space-y-0.5">
						{categoryTree.map((root) => (
							<CategoryTreeItem 
								key={root.id} 
								node={root} 
								depth={0} 
								onEdit={handleOpenUpdateModal}
								onDelete={handleDeleteCategory}
							/>
						))}
					</div>
				)}
			</div>

			{/* MODAL THÊM / SỬA CATEGORY */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-xl w-full max-w-md shadow-2xl p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
						<div className="border-b border-brand-border pb-3">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">
								{modalMode === "create" ? "Thêm danh mục mới" : "Cập nhật danh mục"}
							</h3>
						</div>

						<form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
							<div className="space-y-1">
								<label className="block text-[11px] font-bold text-brand-muted uppercase">Tên danh mục</label>
								<input 
									type="text" 
									required
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									placeholder="Ví dụ: Thiết bị điện tử"
									className="w-full px-3 py-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
								/>
							</div>

							<div className="space-y-1">
								<label className="block text-[11px] font-bold text-brand-muted uppercase">Mô tả</label>
								<textarea 
									value={formDescription}
									onChange={(e) => setFormDescription(e.target.value)}
									placeholder="Nhập mô tả giới thiệu ngành hàng..."
									rows={3}
									className="w-full px-3 py-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
								/>
							</div>

							<div className="space-y-1">
								<label className="block text-[11px] font-bold text-brand-muted uppercase">Danh mục cha (Cấp 1)</label>
								<select
									value={formParentId}
									onChange={(e) => setFormParentId(e.target.value)}
									className="w-full px-3 py-2 border border-brand-border rounded bg-white focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
								>
									<option value="">Không có (Đặt làm Danh mục cha gốc)</option>
									{rootCategoriesForSelect
										.filter((cat: any) => !selectedCategory || cat.id !== selectedCategory.id) // Không chọn chính nó làm cha
										.map((cat: any) => (
											<option key={cat.id} value={cat.id}>
												{cat.name}
											</option>
										))}
								</select>
								<p className="text-[9px] text-brand-muted font-bold mt-1">
									* Hệ thống chỉ cho phép phân cấp 2 tầng (Gốc - Con).
								</p>
							</div>

							<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
								<button 
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-4 py-2 bg-brand-light-soft hover:bg-brand-border rounded font-bold text-brand-dark transition-colors cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button 
									type="submit"
									className="px-4 py-2 bg-brand-primary text-white hover:bg-opacity-95 rounded font-black transition-colors cursor-pointer"
								>
									{modalMode === "create" ? "Tạo ngay" : "Lưu thay đổi"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

// 5. QUẢN LÝ NGƯỜI DÙNG (Users View)
function AdminUsersView() {
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await api.get("/users").catch(() => null);
			const items = response?.data?.value || response?.data || [
				{ id: 1, fullName: "Mỹ Duyên", email: "myduyen@gmail.com", role: "Khách hàng", status: "Active" },
				{ id: 2, fullName: "Vân", email: "tuongvan@gmail.com", role: "Khách hàng, Người bán", status: "Active" },
				{ id: 3, fullName: "Admin System", email: "admin@system.com", role: "Quản trị viên", status: "Active" }
			];
			setUsers(items);
		} catch (err) {
			console.error("Lỗi khi tải danh sách người dùng", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý tài khoản người dùng</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các tài khoản khách hàng, chủ shop và quản trị viên hệ thống</p>
				</div>
				<button onClick={fetchUsers} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách thành viên...
					</div>
				) : users.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không tìm thấy người dùng nào.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/4">Thành viên</th>
								<th className="p-3 w-1/3">Địa chỉ Email</th>
								<th className="p-3 w-1/4">Vai trò hệ thống</th>
								<th className="p-3 text-center w-1/10">Trạng thái</th>
								<th className="p-3 text-center w-1/12">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{users.map((u: any) => (
								<tr key={u.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-bold text-brand-dark">{u.fullName}</td>
									<td className="p-3 font-mono font-bold text-brand-muted">{u.email}</td>
									<td className="p-3 font-bold text-brand-muted text-xs">{u.role}</td>
									<td className="p-3 text-center">
										<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase">Hoạt động</span>
									</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// 6. QUẢN LÝ SHOP (Shops View)
function AdminShopsView() {
	const [shops, setShops] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchShops = async () => {
		try {
			setLoading(true);
			const response = await api.get("/shop/all").catch(() => null); 
			const items = response?.data?.value || response?.data || [
				{ id: 1, name: "Buu Store", description: "Bán hàng gia dụng chất lượng cao", status: "Active", createdDate: new Date() }
			];
			setShops(items);
		} catch (err) {
			console.error("Lỗi khi tải danh sách shop", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShops();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý gian hàng (Shops)</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các cửa hàng người bán hoạt động kinh doanh trên hệ thống</p>
				</div>
				<button onClick={fetchShops} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách shops...
					</div>
				) : shops.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Chưa có shop nào đăng ký trên sàn.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/4">Gian hàng</th>
								<th className="p-3 w-2/5">Mô tả giới thiệu</th>
								<th className="p-3 w-1/6">Ngày gia nhập</th>
								<th className="p-3 text-center w-1/10">Trạng thái</th>
								<th className="p-3 text-center w-1/12">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{shops.map((s: any) => (
								<tr key={s.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-bold text-brand-dark">{s.name}</td>
									<td className="p-3 text-brand-muted font-medium truncate max-w-xs">{s.description || "Chưa cập nhật mô tả"}</td>
									<td className="p-3 text-brand-muted font-bold">{new Date(s.createdDate).toLocaleDateString("vi-VN")}</td>
									<td className="p-3 text-center">
										<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${s.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
											{s.status === "Active" ? "Hoạt động" : "Chờ duyệt"}
										</span>
									</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// MAIN ADMIN DASHBOARD
export default function AdminDashboard() {
	return (
		<Routes>
			<Route index element={<Navigate to="products" replace />} />
			<Route path="products" element={<AdminProductsView />} />
			<Route path="orders" element={<AdminOrdersView />} />
			<Route path="refunds" element={<AdminRefundsView />} />
			<Route path="categories" element={<AdminCategoriesView />} />
			<Route path="users" element={<AdminUsersView />} />
			<Route path="shops" element={<AdminShopsView />} />
		</Routes>
	);
}
