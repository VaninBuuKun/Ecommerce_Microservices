export function SkeletonProductCard() {
	return (
		<div className="bg-white border border-brand-border rounded-2xl p-3.5 space-y-3 animate-pulse text-left shadow-2xs">
			<div className="w-full aspect-square bg-slate-100 rounded-xl" />
			<div className="h-4 bg-slate-100 rounded w-3/4" />
			<div className="h-3 bg-slate-100 rounded w-1/2" />
			<div className="pt-2 border-t border-slate-100 flex justify-between items-center">
				<div className="h-4 bg-slate-100 rounded w-1/3" />
				<div className="h-6 w-16 bg-slate-100 rounded-lg" />
			</div>
		</div>
	);
}

export default SkeletonProductCard;
