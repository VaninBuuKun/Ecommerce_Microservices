import React from "react";

interface NumberInputProps {
	value: number;
	onChange: (val: number) => void;
	placeholder?: string;
	className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
	value,
	onChange,
	placeholder = "0",
	className = "w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none",
}) => {
	return (
		<input
			type="number"
			min={0}
			value={value === 0 ? "" : value}
			onChange={(e) => {
				const val = e.target.value;
				onChange(val === "" ? 0 : Number(val));
			}}
			placeholder={placeholder}
			className={className}
		/>
	);
};
