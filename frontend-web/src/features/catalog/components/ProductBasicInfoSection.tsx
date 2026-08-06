import React from "react";
import { NumberInput, UploadImage } from "../../../shared";

interface ProductBasicInfoProps {
	name: string;
	setName: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	coverImage: string;
	setCoverImage: (val: string) => void;
	weight: number;
	setWeight: (val: number) => void;
	length: number;
	setLength: (val: number) => void;
	width: number;
	setWidth: (val: number) => void;
	height: number;
	setHeight: (val: number) => void;
}

export const ProductBasicInfoSection: React.FC<ProductBasicInfoProps> = ({
	name,
	setName,
	description,
	setDescription,
	coverImage,
	setCoverImage,
	weight,
	setWeight,
	length,
	setLength,
	width,
	setWidth,
	height,
	setHeight,
}) => {
	return (
		<div className="space-y-6">
			{/* Card 1: Thông tin cơ bản */}
			<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
				<h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
					Thông tin cơ bản
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="md:col-span-1">
						<label className="block text-xs font-bold text-brand-dark mb-1.5">
							Ảnh bìa sản phẩm
						</label>
						<UploadImage
							value={coverImage}
							onChange={setCoverImage}
							className="w-28 h-28 rounded-lg"
						/>
					</div>

					<div className="md:col-span-2 space-y-3.5">
						<div>
							<label className="block text-xs font-bold text-brand-dark mb-1">
								Tên sản phẩm
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Nhập tên sản phẩm..."
								className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary"
							/>
						</div>

						<div>
							<label className="block text-xs font-bold text-brand-dark mb-1">
								Mô tả sản phẩm
							</label>
							<textarea
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Nhập mô tả sản phẩm..."
								className="w-full p-2.5 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Card 2: Vận chuyển */}
			<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
				<h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
					Vận chuyển
				</h3>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
					<div>
						<label className="block font-bold text-brand-dark mb-1">
							Khối lượng (gram)
						</label>
						<NumberInput value={weight} onChange={setWeight} />
					</div>
					<div>
						<label className="block font-bold text-brand-dark mb-1">
							Chiều dài (cm)
						</label>
						<NumberInput value={length} onChange={setLength} />
					</div>
					<div>
						<label className="block font-bold text-brand-dark mb-1">
							Chiều rộng (cm)
						</label>
						<NumberInput value={width} onChange={setWidth} />
					</div>
					<div>
						<label className="block font-bold text-brand-dark mb-1">
							Chiều cao (cm)
						</label>
						<NumberInput value={height} onChange={setHeight} />
					</div>
				</div>
			</div>
		</div>
	);
};
