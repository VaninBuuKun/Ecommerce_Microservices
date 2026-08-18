import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useMyProductsQuery, useDeleteProductMutation, catalogApi } from "@/domains/catalog";
import { CreateProductModal } from "./CreateProductModal";
import { ProductTable } from "./ProductTable";
import { ProductSearchBar } from "./ProductSearchBar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/shared";

export function ProductsView() {
	const navigate = useNavigate();
	const { shopId } = useParams<{ shopId?: string }>();
	const numericShopId = shopId ? Number(shopId) : 0;

	const [page, setPage] = useState(1);
	const pageSize = 10;
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		productId: string;
		currentStatus: string;
	} | null>(null);

	const [searchTerm, setSearchTerm] = useState("");

	const { data, isLoading, isError, error } = useMyProductsQuery({
		ShopId: numericShopId,
		page,
		pageSize,
		searchTerm: searchTerm.trim() || undefined,
	});

	const deleteProductMutation = useDeleteProductMutation();

	const queryClient = useQueryClient();
	const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

	const toggleStatusMutation = useMutation({
		mutationFn: (id: string) => catalogApi.toggleProductStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
			toast.success("Cập nhật trạng thái sản phẩm thành công!");
		},
		onError: (err: any) => {
			toast.error(`Cập nhật trạng thái thất bại: ${err?.message || "Lỗi hệ thống"}`);
		},
		onSettled: () => {
			setUpdatingStatusId(null);
			setConfirmModal(null);
		}
	});

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleEditProduct = (productId: string) => {
		navigate(
			`/seller/${shopId || "default"}/dashboard/products/edit/${productId}`,
		);
	};

	const handleDeleteProduct = (productId: string) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
			deleteProductMutation.mutate(productId, {
				onSuccess: () => {
					toast.success("Xóa sản phẩm thành công!");
				},
				onError: (err: any) => {
					toast.error(
						`Xóa sản phẩm thất bại: ${err?.message || "Lỗi hệ thống"}`,
					);
				},
			});
		}
	};

	const handleToggleStatus = (productId: string, currentStatus: string) => {
		setConfirmModal({
			isOpen: true,
			productId,
			currentStatus,
		});
	};

	return (
		<div className="space-y-4 text-left font-sans select-none">
			<div className="flex justify-between items-center pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Quản lý Sản phẩm
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem, sửa đổi và theo dõi hàng tồn kho của bạn trực
						tuyến.
					</p>
				</div>
				<button
					onClick={() => setIsCreateOpen(true)}
					className="h-8 px-3 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark text-xs font-semibold rounded flex items-center gap-1 cursor-pointer transition-all duration-200"
				>
					<Plus className="w-3.5 h-3.5" />
					Thêm sản phẩm mới
				</button>
			</div>

			<ProductSearchBar
				initialSearchTerm={searchTerm}
				onSearch={handleSearch}
			/>

			{isLoading && (
				<div className="flex flex-col items-center justify-center py-12 text-brand-muted text-xs gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
					Đang tải danh sách sản phẩm của shop...
				</div>
			)}

			{isError && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
					Có lỗi xảy ra:{" "}
					{(error as any)?.message || "Không thể tải danh sách sản phẩm"}
				</div>
			)}

			{!isLoading && !isError && data && (
				<div className="space-y-4">
					<ProductTable
						products={data}
						onEdit={handleEditProduct}
						onDelete={handleDeleteProduct}
						onToggleStatus={handleToggleStatus}
						isDeleting={deleteProductMutation.isPending}
						updatingStatusId={updatingStatusId}
					/>

					{data.length > 0 && (
						<div className="flex items-center justify-between p-3 border border-brand-border bg-brand-light-soft/30 rounded-xl text-xs bg-white">
							<span className="text-brand-muted font-medium">
								Trang {page}
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									disabled={page === 1}
									onClick={() => setPage(page - 1)}
									className="px-3 py-1 border border-brand-border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer font-bold transition-all"
								>
									Trước
								</button>
								<button
									type="button"
									disabled={data.length < pageSize}
									onClick={() => setPage(page + 1)}
									className="px-3 py-1 border border-brand-border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer font-bold transition-all"
								>
									Sau
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			<CreateProductModal
				open={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				shopId={numericShopId}
			/>

			<ConfirmModal
				isOpen={!!confirmModal?.isOpen}
				title={
					confirmModal?.currentStatus === "Active"
						? "Xác nhận gỡ bán"
						: "Xác nhận đăng bán"
				}
				message={
					confirmModal?.currentStatus === "Active"
						? "Bạn có chắc chắn muốn gỡ/ẩn sản phẩm này khỏi cửa hàng? Khách hàng sẽ không thể tìm thấy hoặc mua sản phẩm này nữa."
						: "Bạn có chắc chắn muốn đăng bán lại sản phẩm này lên cửa hàng để bắt đầu nhận đơn hàng mới?"
				}
				confirmText={
					confirmModal?.currentStatus === "Active"
						? "Gỡ bán"
						: "Đăng bán"
				}
				cancelText="Hủy bỏ"
				onConfirm={() => {
					if (confirmModal) {
						setUpdatingStatusId(confirmModal.productId);
						toggleStatusMutation.mutate(confirmModal.productId);
					}
				}}
				onCancel={() => setConfirmModal(null)}
				isConfirming={toggleStatusMutation.isPending}
			/>
		</div>
	);
}
export default ProductsView;
