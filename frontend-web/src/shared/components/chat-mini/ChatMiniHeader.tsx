import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CloseOutlined, CommentOutlined, SyncOutlined } from "@ant-design/icons";
import { Maximize2, ArrowLeftRight, Store, Check, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { sellerApi } from "@/domains/seller";

export interface SellerShopItem {
	id: number;
	name: string;
	logoUrl?: string;
	description?: string;
}

interface ChatMiniHeaderProps {
	activeRoom: any;
	isSeller: boolean;
	selectedShop: SellerShopItem | null;
	onClose: () => void;
	onSwitchToBuyer: () => void;
	onSwitchToSeller: (shop: SellerShopItem) => void;
}

export function ChatMiniHeader({
	activeRoom,
	isSeller,
	selectedShop,
	onClose,
	onSwitchToBuyer,
	onSwitchToSeller,
}: ChatMiniHeaderProps) {
	const [shops, setShops] = useState<SellerShopItem[]>([]);
	const [isLoadingShops, setIsLoadingShops] = useState(false);
	const [showShopDropdown, setShowShopDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Đóng dropdown khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setShowShopDropdown(false);
			}
		};
		if (showShopDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showShopDropdown]);

	// Tải danh sách shop nếu người dùng đang ở vai trò Seller nhưng chưa có danh sách
	useEffect(() => {
		if (isSeller && shops.length === 0) {
			sellerApi
				.getMyShops()
				.then((res) => {
					const list: SellerShopItem[] = res?.value?.shops || res?.shops || [];
					setShops(list);
					if (!selectedShop && list.length > 0) {
						onSwitchToSeller(list[0]);
					}
				})
				.catch(() => {});
		}
	}, [isSeller]);

	const handleToggleRole = async () => {
		// 1. Đang ở chế độ Người bán -> chuyển về Người mua ngay lập tức
		if (isSeller) {
			setShowShopDropdown(false);
			onSwitchToBuyer();
			return;
		}

		// 2. Đang ở chế độ Người mua -> chuyển sang Người bán
		let availableShops = shops;
		if (availableShops.length === 0) {
			try {
				setIsLoadingShops(true);
				const res = await sellerApi.getMyShops();
				availableShops = res?.value?.shops || res?.shops || [];
				setShops(availableShops);
			} catch (err) {
				console.warn("Lấy danh sách shop thất bại:", err);
				availableShops = [];
			} finally {
				setIsLoadingShops(false);
			}
		}

		if (availableShops.length === 0) {
			toast.info("Bạn chưa có cửa hàng nào trên hệ thống. Vui lòng đăng ký kênh người bán để bắt đầu!");
			return;
		}

		// Nếu seller chỉ có 1 shop: không cần hiện dropdown, tự động chọn shop đó
		if (availableShops.length === 1) {
			setShowShopDropdown(false);
			onSwitchToSeller(availableShops[0]);
			return;
		}

		// Nếu có nhiều shop (>1): hiện dropdown show shop name list
		setShowShopDropdown(true);
	};

	return (
		<div className="h-12 px-3.5 bg-white border-b border-brand-border flex items-center justify-between select-none shrink-0 shadow-2xs relative">
			<div className="flex items-center gap-2.5 min-w-0" ref={dropdownRef}>
				<CommentOutlined className="text-lg text-brand-primary-deep shrink-0 hover:scale-110 transition-transform" />
				<div className="flex items-center gap-1.5 min-w-0">
					<span className="font-black text-xs text-brand-dark truncate">Chat</span>

					{/* Badge Người mua / Người bán kèm Nút Switch */}
					<div className="flex items-center gap-1 min-w-0">
						<button
							type="button"
							onClick={() => {
								if (isSeller && shops.length > 1) {
									setShowShopDropdown((v) => !v);
								}
							}}
							className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all max-w-[170px] sm:max-w-[210px] ${
								isSeller
									? "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
									: "bg-brand-light-soft text-brand-primary-deep border-brand-border cursor-default"
							}`}
							title={isSeller && shops.length > 1 ? "Bấm để chọn shop khác" : undefined}
						>
							<Store className="w-2.5 h-2.5 shrink-0" />
							<span className="truncate">
								{isSeller
									? selectedShop?.name
										? `Người bán: ${selectedShop.name}`
										: "Người bán"
									: "Người mua"}
							</span>
							{isSeller && shops.length > 1 && (
								<ChevronDown className="w-2.5 h-2.5 shrink-0 text-amber-600" />
							)}
						</button>

						{/* Nút switch chuyển đổi bên phải chữ người mua người bán */}
						<button
							type="button"
							onClick={handleToggleRole}
							disabled={isLoadingShops}
							className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-brand-dark transition-all cursor-pointer border border-slate-200 shadow-2xs hover:scale-105 active:scale-95 shrink-0"
							title={isSeller ? "Chuyển sang chế độ Người mua" : "Chuyển sang chế độ Người bán"}
						>
							{isLoadingShops ? (
								<SyncOutlined spin className="text-[10px] text-brand-primary" />
							) : (
								<ArrowLeftRight className="w-3 h-3" />
							)}
						</button>
					</div>

					{/* Dropdown danh sách Shop nếu seller có nhiều shop */}
					{showShopDropdown && shops.length > 1 && (
						<div className="absolute top-11 left-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
							<div className="px-2 py-1 text-[11px] font-bold text-slate-500 border-b border-slate-100 flex items-center justify-between">
								<span>Chọn cửa hàng</span>
								<span className="text-[10px] font-normal text-slate-400">({shops.length} shop)</span>
							</div>
							<div className="max-h-52 overflow-y-auto py-1 space-y-0.5">
								{shops.map((s) => {
									const isSelected = selectedShop?.id === s.id;
									return (
										<button
											key={s.id}
											type="button"
											onClick={() => {
												setShowShopDropdown(false);
												onSwitchToSeller(s);
											}}
											className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer border-none ${
												isSelected ? "bg-amber-50 text-amber-900" : "hover:bg-slate-50 text-slate-700"
											}`}
										>
											<div className="flex items-center gap-2 min-w-0">
												{s.logoUrl ? (
													<img
														src={s.logoUrl}
														alt={s.name}
														className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
													/>
												) : (
													<div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-amber-200">
														{s.name[0]?.toUpperCase()}
													</div>
												)}
												<span className="text-xs font-semibold truncate max-w-[170px]">{s.name}</span>
											</div>
											{isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center gap-1">
				{/* Nút phóng to toàn màn hình sang /chat */}
				<Link
					to={
						isSeller
							? selectedShop?.id
								? `/chat?seller=true&shopId=${selectedShop.id}`
								: "/chat?seller=true"
							: "/chat"
					}
					onClick={onClose}
					className="p-1.5 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark transition-colors flex items-center justify-center no-underline"
					title="Mở toàn màn hình"
				>
					<Maximize2 className="w-3.5 h-3.5" />
				</Link>

				{/* Nút đóng mini chat */}
				<button
					type="button"
					onClick={onClose}
					className="p-1.5 rounded-md hover:bg-red-50 text-brand-muted hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
					title="Đóng chat"
				>
					<CloseOutlined className="text-xs" />
				</button>
			</div>
		</div>
	);
}

export default ChatMiniHeader;
