export default function CategorySkeleton({ count = 6 }: { count?: number }) {
	return (
		<>
			{Array.from({ length: count }).map((_, idx) => (
				<div
					key={idx}
					className="flex-shrink-0 w-36 p-3 bg-white rounded-lg border border-brand-border flex flex-col items-center space-y-2 animate-pulse"
				>
					<div className="w-14 h-14 rounded-full bg-brand-light-soft" />
					<div className="w-20 h-3 bg-brand-light-soft rounded" />
				</div>
			))}
		</>
	);
}
