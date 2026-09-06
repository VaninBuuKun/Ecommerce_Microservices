import React from "react";
import { Link } from "react-router-dom";
import {
	UserOutlined,
	BellOutlined,
	SearchOutlined,
	BgColorsOutlined,
	FolderOutlined,
	PictureOutlined,
	PaperClipOutlined,
	LeftOutlined,
	RightOutlined,
	CheckOutlined,
	FileTextOutlined,
	DownloadOutlined,
} from "@ant-design/icons";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import type { Conversation, ChatItemTheme, ChatBgTheme, ChatThemePreset } from "../../types/chat.types";
import { CHAT_ITEM_THEMES, CHAT_BG_THEMES, CHAT_THEME_PRESETS, getChatTheme } from "./chat.constants";

interface ChatRightSidebarProps {
	activeRoom: Conversation;
	isSeller: boolean;
	isMuted: boolean;
	onToggleMute: () => void;
	showMessageSearch: boolean;
	onToggleMessageSearch: () => void;
	rightSidebarView: "main" | "resources" | "theme";
	onSetRightSidebarView: (view: "main" | "resources" | "theme") => void;
	resourceActiveTab: "media" | "files";
	onSetResourceActiveTab: (tab: "media" | "files") => void;
	isThemeAccordionOpen: boolean;
	onToggleThemeAccordion: () => void;
	isResourceAccordionOpen: boolean;
	onToggleResourceAccordion: () => void;
	themePreset?: ChatThemePreset;
	previewThemePreset?: ChatThemePreset;
	onSetPreviewThemePreset?: (preset: ChatThemePreset) => void;
	confirmedTheme?: ChatItemTheme;
	confirmedChatBg?: ChatBgTheme;
	previewTheme?: ChatItemTheme;
	onSetPreviewTheme?: (t: ChatItemTheme) => void;
	previewChatBg?: ChatBgTheme;
	onSetPreviewChatBg?: (b: ChatBgTheme) => void;
	hasThemeChanged: boolean;
	onApplyTheme: () => void;
	onCancelTheme: () => void;
	allMediaImages: string[];
	onImageClick: (url: string) => void;
	isApplyingTheme?: boolean;
}

export const ChatRightSidebar: React.FC<ChatRightSidebarProps> = ({
	activeRoom,
	isSeller,
	isMuted,
	onToggleMute,
	showMessageSearch,
	onToggleMessageSearch,
	rightSidebarView,
	onSetRightSidebarView,
	resourceActiveTab,
	onSetResourceActiveTab,
	isThemeAccordionOpen,
	onToggleThemeAccordion,
	isResourceAccordionOpen,
	onToggleResourceAccordion,
	themePreset,
	previewThemePreset,
	onSetPreviewThemePreset,
	confirmedTheme,
	confirmedChatBg,
	previewTheme,
	onSetPreviewTheme,
	previewChatBg,
	onSetPreviewChatBg,
	hasThemeChanged,
	onApplyTheme,
	onCancelTheme,
	allMediaImages,
	onImageClick,
	isApplyingTheme = false,
}) => {
	const currentPreset =
		previewThemePreset ||
		themePreset ||
		getChatTheme(activeRoom.themeColor, activeRoom.backgroundColor);
	const initial = activeRoom.displayName?.[0]?.toUpperCase() || "?";

	return (
		<div className="w-[320px] xl:w-[340px] bg-white flex flex-col overflow-hidden shrink-0 border-l border-slate-200">
			{rightSidebarView === "main" ? (
				/* ===================================================== */
				/* VIEW 1: TRANG CHÍNH THÔNG TIN CUỘC HỘI THOẠI          */
				/* ===================================================== */
				<div className="flex-1 overflow-y-auto divide-y divide-slate-100">
					{/* 1. Profile Người Chat */}
					<div className="p-5 flex flex-col items-center text-center">
						<div className="relative mb-3">
							{activeRoom.displayAvatar ? (
								<img
									src={activeRoom.displayAvatar}
									alt={activeRoom.displayName}
									className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
								/>
							) : (
								<div className="w-20 h-20 rounded-full bg-brand-dark text-brand-primary text-2xl font-black flex items-center justify-center border-2 border-slate-200 shadow-xs">
									{initial}
								</div>
							)}
							<span className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white absolute bottom-1 right-1 shadow-xs" />
						</div>

						<h3 className="font-extrabold text-sm text-slate-900 leading-tight mb-1">
							{activeRoom.displayName}
						</h3>
						<p className="text-[11px] text-slate-400 font-medium mb-3">
							{isSeller ? "Khách hàng mua sắm" : "Gian hàng chính hãng"}
						</p>

						{/* 3 Nút tròn thao tác nhanh */}
						<div className="flex items-center justify-center gap-6 mt-1">
							{/* Nút 1: Trang cá nhân / Xem Shop */}
							<div className="flex flex-col items-center gap-1">
								<Link
									to={isSeller ? `/users/${activeRoom.buyerUserId}` : `/shops/${activeRoom.shopId}`}
									className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition-colors border-none text-decoration-none shadow-2xs"
									title={isSeller ? "Trang cá nhân khách hàng" : "Xem trang shop"}
								>
									<UserOutlined className="text-sm" />
								</Link>
								<span className="text-[10px] font-medium text-slate-600 truncate max-w-[60px]">
									{isSeller ? "Trang cá nhân" : "Xem shop"}
								</span>
							</div>

							{/* Nút 2: Tắt thông báo */}
							<div className="flex flex-col items-center gap-1">
								<button
									type="button"
									onClick={onToggleMute}
									className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer shadow-2xs ${
										isMuted ? "bg-amber-100 text-amber-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
									}`}
									title={isMuted ? "Bật thông báo" : "Tắt thông báo"}
								>
									<BellOutlined className="text-sm" />
								</button>
								<span className="text-[10px] font-medium text-slate-600">
									{isMuted ? "Bật chuông" : "Tắt chuông"}
								</span>
							</div>

							{/* Nút 3: Tìm kiếm tin nhắn */}
							<div className="flex flex-col items-center gap-1">
								<button
									type="button"
									onClick={onToggleMessageSearch}
									className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer shadow-2xs ${
										showMessageSearch ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
									}`}
									title="Tìm kiếm tin nhắn"
								>
									<SearchOutlined className="text-sm" />
								</button>
								<span className="text-[10px] font-medium text-slate-600">Tìm kiếm</span>
							</div>
						</div>
					</div>

					{/* 2. Mục: Tùy chỉnh đoạn chat */}
					<div className="py-2">
						<button
							type="button"
							onClick={onToggleThemeAccordion}
							className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer font-bold text-xs text-slate-800"
						>
							<div className="flex items-center gap-2.5">
								<BgColorsOutlined className="text-sm text-slate-500" />
								<span>Tùy chỉnh đoạn chat</span>
							</div>
							{/* Dùng icon Lucide Chevron khỏe khoắn, tỷ lệ cân đối */}
							{isThemeAccordionOpen ? (
								<ChevronUp className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2.2} />
							) : (
								<ChevronDown className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2.2} />
							)}
						</button>

						{isThemeAccordionOpen && (
							<div className="px-2 py-1 space-y-1 bg-slate-50/40">
								<button
									type="button"
									onClick={() => onSetRightSidebarView("theme")}
									className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-100/80 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-left"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<div className="flex items-center -space-x-1 shrink-0">
											<span
												style={{ backgroundColor: currentPreset.previewHex }}
												className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
												title={currentPreset.name}
											/>
											<span
												style={{ backgroundColor: currentPreset.secondaryPreviewHex }}
												className="w-4 h-4 rounded-full border border-white shadow-2xs"
											/>
										</div>
										<span className="text-xs font-semibold text-slate-700 truncate">
											Chủ đề: {currentPreset.name}
										</span>
									</div>
									<RightOutlined className="text-xs text-slate-400 shrink-0" />
								</button>
							</div>
						)}
					</div>

					{/* 3. Mục: Tài nguyên (2 mục con: File phương tiện & Tệp đính kèm) */}
					<div className="py-2">
						<button
							type="button"
							onClick={onToggleResourceAccordion}
							className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer font-bold text-xs text-slate-800"
						>
							<div className="flex items-center gap-2.5">
								<FolderOutlined className="text-sm text-slate-500" />
								<span>Tài nguyên</span>
							</div>
							{/* Dùng icon Lucide Chevron khỏe khoắn, tỷ lệ cân đối */}
							{isResourceAccordionOpen ? (
								<ChevronUp className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2.2} />
							) : (
								<ChevronDown className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2.2} />
							)}
						</button>

						{isResourceAccordionOpen && (
							<div className="px-2 py-1 space-y-1 bg-slate-50/40">
								{/* Mục con 1: File phương tiện */}
								<button
									type="button"
									onClick={() => {
										onSetResourceActiveTab("media");
										onSetRightSidebarView("resources");
									}}
									className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-100/80 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-left"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<PictureOutlined className="text-sm text-slate-500 shrink-0" />
										<span className="text-xs font-semibold text-slate-700 truncate">File phương tiện (Ảnh & Video)</span>
									</div>
									<RightOutlined className="text-xs text-slate-400 shrink-0" />
								</button>

								{/* Mục con 2: Tệp đính kèm */}
								<button
									type="button"
									onClick={() => {
										onSetResourceActiveTab("files");
										onSetRightSidebarView("resources");
									}}
									className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-100/80 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-left"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<PaperClipOutlined className="text-sm text-slate-500 shrink-0" />
										<span className="text-xs font-semibold text-slate-700 truncate">Tệp đính kèm (File)</span>
									</div>
									<RightOutlined className="text-xs text-slate-400 shrink-0" />
								</button>
							</div>
						)}
					</div>
				</div>
			) : rightSidebarView === "theme" ? (
				/* ===================================================== */
				/* VIEW 2: SUB-VIEW TÙY CHỈNH CHỦ ĐỀ & MÀU SẮC           */
				/* Live Preview, Nút Hủy Bỏ và Áp Dụng Lưu Backend       */
				/* ===================================================== */
				<div className="flex-1 flex flex-col overflow-hidden bg-white">
					{/* Header có nút Back ← */}
					<div className="h-14 px-3 border-b border-slate-200 flex items-center gap-2.5 shrink-0 bg-white">
						<button
							type="button"
							onClick={onCancelTheme}
							className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors border-none bg-transparent cursor-pointer shrink-0"
							title="Hủy và quay lại"
						>
							<LeftOutlined className="text-sm" />
						</button>
						<div className="min-w-0">
							<h3 className="font-extrabold text-sm text-slate-900 leading-tight">
								Chủ đề & Phối màu
							</h3>
							<p className="text-[10px] text-slate-400 font-medium truncate">
								Tự động phối nền và bong bóng cả 2 bên
							</p>
						</div>
					</div>

					{/* Danh sách chủ đề phối màu đồng bộ */}
					<div className="flex-1 overflow-y-auto p-3.5 space-y-3">
						<div className="grid grid-cols-1 gap-2.5">
							{CHAT_THEME_PRESETS.map((preset) => {
								const isSelected = currentPreset.id === preset.id;
								return (
									<div
										key={preset.id}
										onClick={() => {
											if (onSetPreviewThemePreset) {
												onSetPreviewThemePreset(preset);
											}
										}}
										className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
											isSelected
												? "border-brand-primary ring-2 ring-brand-primary/40 bg-brand-primary/5 shadow-xs"
												: "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
										}`}
									>
										{/* Tên & huy hiệu xem trước màu */}
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<div className="flex items-center -space-x-1">
													<span
														style={{ backgroundColor: preset.previewHex }}
														className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
													/>
													<span
														style={{ backgroundColor: preset.secondaryPreviewHex }}
														className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
													/>
												</div>
												<span className="text-xs font-bold text-slate-800">{preset.name}</span>
											</div>
											{isSelected && (
												<span className="w-5 h-5 rounded-full bg-brand-primary text-brand-dark flex items-center justify-center text-[10px] font-black shadow-2xs">
													<CheckOutlined />
												</span>
											)}
										</div>

										{/* Khung mô phỏng trực quan mini cả 2 bên hội thoại */}
										<div
											className={`p-2 rounded-lg ${preset.background} border border-black/5 flex flex-col space-y-1.5 transition-colors overflow-hidden`}
										>
											{/* Tin nhắn đối phương (Bên trái) - Đã được đồng bộ màu sắc và viền phù hợp */}
											<div className="flex justify-start">
												<div
													className={`text-[10px] font-medium px-2 py-1 rounded-xl rounded-tl-xs border max-w-[85%] ${preset.theirBubble.bg} ${preset.theirBubble.text} ${preset.theirBubble.border}`}
												>
													Xin chào bạn! 👋
												</div>
											</div>

											{/* Tin nhắn cá nhân (Bên phải) */}
											<div className="flex justify-end">
												<div
													className={`text-[10px] font-medium px-2 py-1 rounded-xl rounded-tr-xs max-w-[85%] ${preset.myBubble.bg} ${preset.myBubble.text} ${preset.myBubble.border || ""}`}
												>
													Shop tư vấn giúp mình nhé ✨
												</div>
											</div>
										</div>

										{preset.description && (
											<p className="text-[10px] text-slate-500 mt-1.5 line-clamp-1">
												{preset.description}
											</p>
										)}
									</div>
								);
							})}
						</div>

						{/* Chú thích xem trước trực tiếp */}
						<div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-brand-dark text-[11px] leading-relaxed">
							💡 <strong>Xem trước trực tiếp:</strong> Màu sắc đã chọn đang hiển thị ngay trên khung chat bên cạnh. Bạn có thể nhấn <strong>Hủy bỏ</strong> để khôi phục màu cũ hoặc <strong>Áp dụng</strong> để lưu lại cho phòng chat này.
						</div>
					</div>

					{/* Footer nút Hủy bỏ & Áp dụng */}
					<div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={onCancelTheme}
							className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer bg-white"
						>
							Hủy bỏ
						</button>
						<button
							type="button"
							onClick={onApplyTheme}
							disabled={!hasThemeChanged || isApplyingTheme}
							className={`flex-1 py-2 rounded-lg border-none text-xs font-bold transition-all ${
								hasThemeChanged
									? "bg-brand-dark hover:bg-black text-brand-primary cursor-pointer shadow-sm"
									: "bg-slate-100 text-slate-400 cursor-not-allowed"
							}`}
						>
							{isApplyingTheme ? "Đang lưu..." : "Áp dụng"}
						</button>
					</div>
				</div>
			) : (
				/* ===================================================== */
				/* VIEW 3: SUB-VIEW TÀI NGUYÊN (File phương tiện & File) */
				/* ===================================================== */
				<div className="flex-1 flex flex-col overflow-hidden bg-white">
					{/* Header có nút Back ← */}
					<div className="h-14 px-3 border-b border-slate-200 flex items-center gap-2.5 shrink-0 bg-white">
						<button
							type="button"
							onClick={() => onSetRightSidebarView("main")}
							className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors border-none bg-transparent cursor-pointer shrink-0"
							title="Quay lại"
						>
							<LeftOutlined className="text-sm" />
						</button>
						<h3 className="font-extrabold text-sm text-slate-900">
							File phương tiện và file
						</h3>
					</div>

					{/* 2 Tabs: File phương tiện vs File */}
					<div className="flex border-b border-slate-200 shrink-0 px-2 bg-white">
						<button
							type="button"
							onClick={() => onSetResourceActiveTab("media")}
							className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-none bg-transparent cursor-pointer relative ${
								resourceActiveTab === "media"
									? "text-brand-dark font-black"
									: "text-slate-500 hover:text-slate-800"
							}`}
						>
							File phương tiện
							{resourceActiveTab === "media" && (
								<motion.div
									layoutId="activeTabUnderline"
									className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-primary rounded-full"
								/>
							)}
						</button>

						<button
							type="button"
							onClick={() => onSetResourceActiveTab("files")}
							className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-none bg-transparent cursor-pointer relative ${
								resourceActiveTab === "files"
									? "text-brand-dark font-black"
									: "text-slate-500 hover:text-slate-800"
							}`}
						>
							File
							{resourceActiveTab === "files" && (
								<motion.div
									layoutId="activeTabUnderline"
									className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-primary rounded-full"
								/>
							)}
						</button>
					</div>

					{/* Tab Content */}
					{resourceActiveTab === "media" ? (
						<div className="flex-1 overflow-y-auto p-3 space-y-4">
							{allMediaImages.length === 0 ? (
								<div className="py-12 text-center text-xs text-slate-400 font-medium">
									Chưa có file phương tiện nào trong cuộc trò chuyện này.
								</div>
							) : (
								<div>
									<h4 className="font-extrabold text-xs text-slate-900 mb-2">Đã chia sẻ</h4>
									<div className="grid grid-cols-3 gap-1.5">
										{allMediaImages.map((imgUrl, idx) => (
											<div
												key={idx}
												onClick={() => onImageClick(imgUrl)}
												className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-102 transition-all relative group shadow-2xs"
											>
												<img src={imgUrl} alt={`media-${idx}`} className="w-full h-full object-cover" />
												<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
													🔍
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200/60 mt-4">
								<p className="text-[11px] text-slate-600 font-medium">
									Có thể thiếu một số file phương tiện.{" "}
									<button
										type="button"
										onClick={() => toast.info("Đã đồng bộ toàn bộ file phương tiện từ máy chủ!")}
										className="text-brand-dark font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
									>
										Khôi phục ngay
									</button>
								</p>
							</div>
						</div>
					) : (
						<div className="flex-1 overflow-y-auto p-3 space-y-2">
							<div className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
										<FileTextOutlined className="text-base" />
									</div>
									<div className="min-w-0">
										<p className="text-xs font-bold text-slate-800 truncate">Hoa_don_dien_tu.pdf</p>
										<p className="text-[10px] text-slate-400 font-medium">1.2 MB • 02/09/2026</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => toast.success("Đang tải file...")}
									className="p-1 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
									title="Tải xuống"
								>
									<DownloadOutlined className="text-sm" />
								</button>
							</div>

							<div className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
										<FileTextOutlined className="text-base" />
									</div>
									<div className="min-w-0">
										<p className="text-xs font-bold text-slate-800 truncate">Bang_thong_so_ky_thuat.xlsx</p>
										<p className="text-[10px] text-slate-400 font-medium">450 KB • 01/09/2026</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => toast.success("Đang tải file...")}
									className="p-1 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
									title="Tải xuống"
								>
									<DownloadOutlined className="text-sm" />
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
