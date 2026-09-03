import React from "react";

export type BadgeVariant =
	| "blue"
	| "green"
	| "emerald"
	| "amber"
	| "orange"
	| "red"
	| "rose"
	| "purple"
	| "violet"
	| "indigo"
	| "cyan"
	| "teal"
	| "slate"
	| "gray"
	| "brand"
	| "dark";

type BadgeAppearance = "soft" | "solid" | "outline";
export type BadgeSize = "xs" | "sm" | "md" | "lg";
export type BadgeShape = "rounded" | "pill" | "square";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	appearance?: BadgeAppearance;
	size?: BadgeSize;
	shape?: BadgeShape;
	dot?: boolean;
	pulse?: boolean;
	icon?: React.ReactNode;
	children?: React.ReactNode;
}

const variantStyles: Record<
	BadgeVariant,
	{
		soft: string;
		solid: string;
		outline: string;
		dot: string;
	}
> = {
	blue: {
		soft: "bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100/60",
		solid: "bg-blue-600 text-white border-blue-600",
		outline: "bg-transparent text-blue-600 border-blue-300",
		dot: "bg-blue-500",
	},
	green: {
		soft: "bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/60",
		solid: "bg-emerald-600 text-white border-emerald-600",
		outline: "bg-transparent text-emerald-600 border-emerald-300",
		dot: "bg-emerald-500",
	},
	emerald: {
    soft: "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70 transition-colors",
    solid: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm transition-all",
    outline: "bg-transparent text-emerald-700 border-emerald-300/80 hover:bg-emerald-50 transition-colors",
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]", // Hiệu ứng phát sáng nhẹ cho dot trạng thái
},
	amber: {
		soft: "bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/60",
		solid: "bg-amber-500 text-white border-amber-500",
		outline: "bg-transparent text-amber-600 border-amber-300",
		dot: "bg-amber-500",
	},
	orange: {
		soft: "bg-orange-50 text-orange-800 border-orange-200/90 hover:bg-orange-100/60",
		solid: "bg-orange-500 text-white border-orange-500",
		outline: "bg-transparent text-orange-600 border-orange-300",
		dot: "bg-orange-500",
	},
	red: {
		soft: "bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100/60",
		solid: "bg-rose-600 text-white border-rose-600",
		outline: "bg-transparent text-rose-600 border-rose-300",
		dot: "bg-rose-500",
	},
	rose: {
		soft: "bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100/60",
		solid: "bg-rose-600 text-white border-rose-600",
		outline: "bg-transparent text-rose-600 border-rose-300",
		dot: "bg-rose-500",
	},
	purple: {
		soft: "bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100/60",
		solid: "bg-purple-600 text-white border-purple-600",
		outline: "bg-transparent text-purple-600 border-purple-300",
		dot: "bg-purple-500",
	},
	violet: {
		soft: "bg-violet-50 text-violet-700 border-violet-200/90 hover:bg-violet-100/60",
		solid: "bg-violet-600 text-white border-violet-600",
		outline: "bg-transparent text-violet-600 border-violet-300",
		dot: "bg-violet-500",
	},
	indigo: {
		soft: "bg-indigo-50 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100/60",
		solid: "bg-indigo-600 text-white border-indigo-600",
		outline: "bg-transparent text-indigo-600 border-indigo-300",
		dot: "bg-indigo-500",
	},
	cyan: {
		soft: "bg-cyan-50 text-cyan-700 border-cyan-200/90 hover:bg-cyan-100/60",
		solid: "bg-cyan-600 text-white border-cyan-600",
		outline: "bg-transparent text-cyan-600 border-cyan-300",
		dot: "bg-cyan-500",
	},
	teal: {
		soft: "bg-teal-50 text-teal-700 border-teal-200/90 hover:bg-teal-100/60",
		solid: "bg-teal-600 text-white border-teal-600",
		outline: "bg-transparent text-teal-600 border-teal-300",
		dot: "bg-teal-500",
	},
	slate: {
		soft: "bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200/60",
		solid: "bg-slate-700 text-white border-slate-700",
		outline: "bg-transparent text-slate-700 border-slate-300",
		dot: "bg-slate-400",
	},
	gray: {
		soft: "bg-gray-100 text-gray-700 border-gray-200/90 hover:bg-gray-200/60",
		solid: "bg-gray-700 text-white border-gray-700",
		outline: "bg-transparent text-gray-700 border-gray-300",
		dot: "bg-gray-400",
	},
	brand: {
		soft: "bg-brand-primary/10 text-brand-primary-deep border-brand-primary/25 hover:bg-brand-primary/15",
		solid: "bg-brand-primary text-brand-dark border-brand-primary",
		outline: "bg-transparent text-brand-primary-deep border-brand-primary/40",
		dot: "bg-brand-primary",
	},
	dark: {
		soft: "bg-slate-800/10 text-slate-900 border-slate-300",
		solid: "bg-slate-900 text-white border-slate-900",
		outline: "bg-transparent text-slate-900 border-slate-400",
		dot: "bg-slate-300",
	},
};

const sizeStyles: Record<BadgeSize, string> = {
	xs: "text-[8px] px-1.5 py-0.5 gap-1",
	sm: "text-[9px] sm:text-[10px] px-2 py-[3px] gap-1.5 font-extrabold",
	md: "text-xs px-2.5 py-1 gap-1.5 font-bold",
	lg: "text-sm px-3 py-1.5 gap-2 font-bold",
};

const shapeStyles: Record<BadgeShape, string> = {
	rounded: "rounded-[4px]",
	pill: "rounded-full",
	square: "rounded-xs",
};

export const Badge: React.FC<BadgeProps> = ({
	variant = "slate",
	appearance = "soft",
	size = "sm",
	shape = "rounded",
	dot = false,
	pulse = false,
	icon,
	children,
	className = "",
	...props
}) => {
	const currentVariant = variantStyles[variant] || variantStyles.slate;
	const appearanceClass = currentVariant[appearance] || currentVariant.soft;
	const sizeClass = sizeStyles[size] || sizeStyles.sm;
	const shapeClass = shapeStyles[shape] || shapeStyles.rounded;

	return (
		<span
			className={`inline-flex items-center justify-center border leading-none tracking-normal select-none transition-all duration-150 ${shapeClass} ${sizeClass} ${appearanceClass} ${className}`}
			{...props}
		>
			{dot && (
				<span className="relative flex h-1.5 w-1.5 shrink-0">
					{pulse && (
						<span
							className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentVariant.dot}`}
						/>
					)}
					<span
						className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentVariant.dot}`}
					/>
				</span>
			)}
			{icon && <span className="shrink-0 flex items-center">{icon}</span>}
			{children && <span>{children}</span>}
		</span>
	);
};

export default Badge;
