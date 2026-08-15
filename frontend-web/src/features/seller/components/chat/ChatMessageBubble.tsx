import { Paperclip, FileText, FileSpreadsheet, Presentation, Archive } from "lucide-react";

interface ChatMessageBubbleProps {
	content: string;
	fromMe: boolean;
	sentAt: string;
}

// ─── File type detection utilities ───────────────────────────
const IMAGE_EXTENSIONS = /\.(jpeg|jpg|gif|png|webp|bmp|svg|avif|tiff)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;
const DOC_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt)$/i;
const ARCHIVE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|bz2)$/i;

function getCleanUrl(url: string): string {
	return url.split("?")[0].toLowerCase();
}

function isMediaUrl(url: string): boolean {
	return (
		url.startsWith("http") &&
		(url.includes("/medias/") ||
			url.includes("amazonaws.com") ||
			url.includes(".s3."))
	);
}

type FileCategory = "sticker" | "image" | "video" | "pdf" | "doc" | "spreadsheet" | "presentation" | "archive" | "file" | "text";

function classifyContent(content: string): FileCategory {
	if (content.startsWith("[sticker]:")) return "sticker";
	if (!content.startsWith("http")) return "text";
	const clean = getCleanUrl(content);

	if (IMAGE_EXTENSIONS.test(clean)) return "image";
	if (VIDEO_EXTENSIONS.test(clean)) return "video";
	if (/\.pdf$/i.test(clean)) return "pdf";
	if (/\.(doc|docx|rtf|odt|txt)$/i.test(clean)) return "doc";
	if (/\.(xls|xlsx|csv)$/i.test(clean)) return "spreadsheet";
	if (/\.(ppt|pptx)$/i.test(clean)) return "presentation";
	if (ARCHIVE_EXTENSIONS.test(clean)) return "archive";
	if (isMediaUrl(content)) return "file";

	return "text";
}

function getFileName(url: string): string {
	const clean = url.split("?")[0];
	const segment = clean.split("/").pop() || "Tệp đính kèm";
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

function getExtension(url: string): string {
	const clean = url.split("?")[0];
	const dot = clean.lastIndexOf(".");
	return dot >= 0 ? clean.substring(dot + 1).toUpperCase() : "";
}

// ─── File type icon + color config ───────────────────────────
const FILE_ICON_CONFIG: Record<
	string,
	{ icon: React.ReactNode; color: string; bg: string }
> = {
	pdf: {
		icon: <FileText className="w-4 h-4" />,
		color: "text-red-600",
		bg: "bg-red-50",
	},
	doc: {
		icon: <FileText className="w-4 h-4" />,
		color: "text-blue-600",
		bg: "bg-blue-50",
	},
	spreadsheet: {
		icon: <FileSpreadsheet className="w-4 h-4" />,
		color: "text-green-600",
		bg: "bg-green-50",
	},
	presentation: {
		icon: <Presentation className="w-4 h-4" />,
		color: "text-orange-600",
		bg: "bg-orange-50",
	},
	archive: {
		icon: <Archive className="w-4 h-4" />,
		color: "text-purple-600",
		bg: "bg-purple-50",
	},
	file: {
		icon: <Paperclip className="w-4 h-4" />,
		color: "text-gray-600",
		bg: "bg-gray-50",
	},
};

// ─── Component ───────────────────────────────────────────────
export default function ChatMessageBubble({
	content,
	fromMe,
	sentAt,
}: ChatMessageBubbleProps) {
	const category = classifyContent(content);

	const timeLabel = new Date(sentAt).toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});

	// ─── Sticker ────────────────────────────────────
	if (category === "sticker") {
		const stickerUrl = content.replace("[sticker]:", "");
		return (
			<div
				className={`flex flex-col max-w-[85%] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
			>
				<div className="w-18 h-18 p-1 select-none pointer-events-none">
					<img
						src={stickerUrl}
						alt="Sticker"
						className="w-full h-full object-contain animate-bounce-slow"
					/>
				</div>
				<span className="text-[7px] text-brand-muted mt-0.5 px-1 font-bold select-none">
					{timeLabel}
				</span>
			</div>
		);
	}

	// ─── Image ──────────────────────────────────────
	if (category === "image") {
		return (
			<div
				className={`flex flex-col max-w-[85%] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
			>
				<div
					className="cursor-pointer"
					onClick={() => window.open(content, "_blank")}
				>
					<img
						src={content}
						alt="Hình ảnh"
						className="max-w-[200px] max-h-[200px] rounded-xl object-cover shadow-md border border-brand-border/40 hover:opacity-90 transition-opacity"
						onError={(e) => {
							(e.target as HTMLImageElement).style.display =
								"none";
						}}
					/>
				</div>
				<span className="text-[7px] text-brand-muted mt-0.5 px-1 font-bold select-none">
					{timeLabel}
				</span>
			</div>
		);
	}

	// ─── Video ──────────────────────────────────────
	if (category === "video") {
		return (
			<div
				className={`flex flex-col max-w-[85%] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
			>
				<video
					src={content}
					controls
					preload="metadata"
					className="max-w-[220px] max-h-[180px] rounded-xl shadow-md border border-brand-border/40"
				/>
				<span className="text-[7px] text-brand-muted mt-0.5 px-1 font-bold select-none">
					{timeLabel}
				</span>
			</div>
		);
	}

	// ─── Document / Archive / File ──────────────────
	if (["pdf", "doc", "spreadsheet", "presentation", "archive", "file"].includes(category)) {
		const config = FILE_ICON_CONFIG[category] || FILE_ICON_CONFIG.file;
		const fileName = getFileName(content);
		const ext = getExtension(content);

		return (
			<div
				className={`flex flex-col max-w-[85%] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
			>
				<a
					href={content}
					target="_blank"
					rel="noopener noreferrer"
					download
					className={`flex items-center gap-2.5 p-2.5 rounded-xl text-[11px] font-semibold shadow-sm select-text transition-colors ${
						fromMe
							? "bg-brand-primary/90 text-brand-dark hover:bg-brand-primary/70"
							: "bg-white border border-brand-border text-brand-dark hover:bg-brand-light-soft/40"
					}`}
				>
					{/* Extension icon badge */}
					<div
						className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center shrink-0`}
					>
						{config.icon}
					</div>
					<div className="flex flex-col min-w-0">
						<span className="truncate max-w-[140px] font-bold text-[10px] leading-tight">
							{fileName}
						</span>
						{ext && (
							<span className="text-[8px] text-brand-muted font-semibold uppercase">
								{ext} Document
							</span>
						)}
					</div>
				</a>
				<span className="text-[7px] text-brand-muted mt-0.5 px-1 font-bold select-none">
					{timeLabel}
				</span>
			</div>
		);
	}

	// ─── Plain text ─────────────────────────────────
	return (
		<div
			className={`flex flex-col max-w-[85%] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
		>
			<div
				className={`p-2.5 rounded-2xl text-[11px] leading-relaxed font-semibold shadow-sm select-text ${
					fromMe
						? "bg-brand-primary text-brand-dark rounded-tr-none"
						: "bg-white border border-brand-border text-brand-dark rounded-tl-none"
				}`}
			>
				{content}
			</div>
			<span className="text-[7px] text-brand-muted mt-0.5 px-1 font-bold select-none">
				{timeLabel}
			</span>
		</div>
	);
}

