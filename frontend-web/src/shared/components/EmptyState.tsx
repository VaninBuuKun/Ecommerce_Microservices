import { LucideIcon, PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	actionText?: string;
	actionLink?: string;
	onActionClick?: () => void;
}

export function EmptyState({
	icon: Icon = PackageOpen,
	title,
	description,
	actionText,
	actionLink,
	onActionClick,
}: EmptyStateProps) {
	return (
		<div className="bg-white border border-brand-border rounded-2xl p-10 text-center space-y-4 font-sans max-w-md mx-auto my-6 shadow-xs">
			<div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
				<Icon className="w-7 h-7" />
			</div>
			<div className="space-y-1">
				<h3 className="text-sm font-black text-brand-dark">{title}</h3>
				{description && <p className="text-xs text-brand-muted leading-relaxed font-medium">{description}</p>}
			</div>
			{actionText && (
				<div className="pt-2">
					{actionLink ? (
						<Link
							to={actionLink}
							className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl shadow-xs transition-colors"
						>
							{actionText}
						</Link>
					) : (
						<button
							onClick={onActionClick}
							className="px-5 py-2.5 bg-brand-dark hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-none"
						>
							{actionText}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

export default EmptyState;
