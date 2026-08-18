import { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import { Loader2, RefreshCw, FolderOpen } from "lucide-react";

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
							className="p-1 hover:bg-brand-border rounded cursor-pointer transition-colors text-brand-muted hover:text-brand-dark border-none bg-transparent"
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
							className="px-2 py-1 bg-brand-light-soft text-brand-primary-deep hover:bg-brand-primary/10 rounded font-black transition-colors cursor-pointer border-none text-[9px]"
						>
							Sửa
						</button>
						<button 
							onClick={() => onDelete(node.id)}
							className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-black transition-colors cursor-pointer border-none text-[9px]"
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

export function AdminCategoriesView() {
	const [categories, setCategories] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	
	// Search & Pagination states
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(8);

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
			const mockCategories = [
				{ id: "1", name: "Thời Trang & Phụ Kiện", description: "Quần áo, túi xách, phụ kiện thời trang", parentId: null },
				{ id: "2", name: "Thời Trang Nam", description: "Áo sơ mi, quần tây, áo phông", parentId: "1" },
				{ id: "3", name: "Thời Trang Nữ", description: "Váy, đầm, thời trang nữ cao cấp", parentId: "1" },
				{ id: "4", name: "Thiết Bị Điện Tử", description: "Điện thoại, máy tính, phụ kiện công nghệ", parentId: null },
				{ id: "5", name: "Điện Thoại & Phụ Kiện", description: "Smartphone, ốp lưng, sạc dự phòng", parentId: "4" },
				{ id: "6", name: "Nhà Cửa & Đời Sống", description: "Đồ gia dụng, trang trí nhà cửa", parentId: null },
			];
			setCategories(mockCategories);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	// Lọc danh mục theo tìm kiếm
	const filteredCategories = categories.filter((cat) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase().trim();
		return cat.name?.toLowerCase().includes(query) || cat.description?.toLowerCase().includes(query);
	});

	// Phân trang
	const totalItems = filteredCategories.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

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

	const categoryTree = buildCategoryTree(paginatedCategories);

	// Lọc danh sách danh mục làm cha (chỉ lấy level 1 - root categories không có parentId)
	const rootCategoriesForSelect = categories.filter(
		(cat: any) => !cat.parentId || cat.parentId === "00000000-0000-0000-0000-000000000000"
	);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Danh mục sản phẩm hệ thống</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Cơ cấu cây phân cấp các ngành hàng và danh mục sản phẩm của toàn hệ thống</p>
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					{/* Search Box */}
					<div className="relative flex-1 sm:w-60">
						<input
							type="text"
							placeholder="Tìm kiếm danh mục..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark bg-white"
						/>
						<FolderOpen className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
					</div>
					<button 
						onClick={handleOpenCreateModal}
						className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg text-[11px] font-black tracking-wide transition-colors cursor-pointer border-none shrink-0"
					>
						+ Thêm danh mục
					</button>
					<button onClick={fetchCategories} title="Làm mới" className="p-1.5 text-brand-muted hover:text-brand-dark rounded-lg hover:bg-brand-light-soft transition-colors cursor-pointer border border-brand-border bg-white shrink-0">
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
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không tìm thấy danh mục sản phẩm nào.</div>
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

				{/* Pagination Controls Footer */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between p-3 border-t border-brand-border text-xs text-brand-muted font-bold bg-brand-light-soft/20">
						<span>Hiển thị trang {page} / {totalPages} (Tổng {totalItems} danh mục)</span>
						<div className="flex items-center gap-1">
							<button
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
								className="px-2.5 py-1 bg-white border border-brand-border rounded hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
							>
								&lt; Trước
							</button>
							<button
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="px-2.5 py-1 bg-white border border-brand-border rounded hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
							>
								Sau &gt;
							</button>
						</div>
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
										.filter((cat: any) => !selectedCategory || cat.id !== selectedCategory.id)
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
									className="px-4 py-2 bg-brand-light-soft hover:bg-brand-border rounded font-bold text-brand-dark transition-colors cursor-pointer border-none"
								>
									Hủy bỏ
								</button>
								<button 
									type="submit"
									className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black rounded transition-colors cursor-pointer border-none"
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
