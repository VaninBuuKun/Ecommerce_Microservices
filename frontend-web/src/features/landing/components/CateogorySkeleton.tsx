export default function CategorySkeleton() {
	// Tạo một mảng giả lập 10 cột (mỗi cột gồm 2 item tương ứng 2 dòng) để lấp đầy khung nhìn ngang
	const skeletonColumns = Array.from({ length: 10 });

	return (
		<section className="py-20 px-6 max-w-6xl mx-auto w-full">
			{/* Phần tiêu đề Skeleton */}
			<div className="flex flex-col md:flex-row md:items-end justify-between mb-8 text-left">
				<div className="space-y-2">
					<div className="w-24 h-3 bg-brand-border/60 rounded animate-pulse" />
					<div className="w-64 h-8 bg-brand-border/60 rounded animate-pulse" />
				</div>
				<div className="flex gap-2 mt-4 md:mt-0">
					<div className="w-9 h-9 rounded-full bg-brand-border/60 animate-pulse" />
					<div className="w-9 h-9 rounded-full bg-brand-border/60 animate-pulse" />
				</div>
			</div>

			{/* Phần danh sách 2 dòng chạy ngang */}
			<div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
				{skeletonColumns.map((_, index) => (
					<div
						key={index}
						className="flex flex-col gap-4 flex-shrink-0 w-[120px]"
					>
						{/* Item dòng trên */}
						<div className="flex flex-col items-center space-y-2">
							<div className="w-[120px] h-[120px] rounded-full bg-brand-border/60 animate-pulse" />
							<div className="w-20 h-3 bg-brand-border/60 rounded animate-pulse" />
						</div>
						{/* Item dòng dưới */}
						<div className="flex flex-col items-center space-y-2">
							<div className="w-[120px] h-[120px] rounded-full bg-brand-border/60 animate-pulse" />
							<div className="w-20 h-3 bg-brand-border/60 rounded animate-pulse" />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
