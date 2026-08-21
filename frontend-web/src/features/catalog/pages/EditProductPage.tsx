import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
	useProductByIdQuery,
	useUpdateProductMutation,
	useBulkUpdateVariantsMutation,
} from "../hooks";
import {
	VariantsSection,
	type GeneratedVariantType,
	type OptionType,
} from "../components/ProductVariantSection";
import { ProductBasicInfoSection } from "../components/ProductBasicInfoSection";
import { useUpdateProductSaleMutation } from "../hooks/useUpdateProductSaleMutation";

function cartesianProduct<T>(arrays: T[][]): T[][] {
	return arrays.reduce<T[][]>(
		(acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
		[[]],
	);
}

export default function EditProductPage() {
	const { productId, shopId } = useParams<{
		productId: string;
		shopId: string;
	}>();
	const navigate = useNavigate();

	const isNew = productId === "new";
	const {
		data: loadedProduct,
		isLoading,
		isError,
	} = useProductByIdQuery(isNew ? undefined : productId);

	const updateProductMutation = useUpdateProductMutation();
	const updateProductSaleMutation = useUpdateProductSaleMutation();
	const bulkUpdateVariantsMutation = useBulkUpdateVariantsMutation();

	const [activeSection, setActiveSection] = useState<"basic" | "variants">(
		"basic",
	);

	// Basic Info State
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [categoryId, setCategoryId] = useState("");

	// Shipping State
	const [weight, setWeight] = useState(0);
	const [length, setLength] = useState(0);
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);

	// Simple product price/stock state (only used when enableVariants === false)
	const [simplePrice, setSimplePrice] = useState(0);
	const [simpleDiscountPrice, setSimpleDiscountPrice] = useState(0);
	const [simpleStock, setSimpleStock] = useState(0);

	// Variants State
	const [enableVariants, setEnableVariants] = useState(false);
	const [options, setOptions] = useState<OptionType[]>([]);
	const [generatedVariants, setGeneratedVariants] = useState<
		GeneratedVariantType[]
	>([]);
	const isLoadedFromDb = useRef(false);

	useEffect(() => {
		if (loadedProduct && !isNew) {
			setName(loadedProduct.name);
			setDescription(loadedProduct.description);
			setCategoryId(loadedProduct.categoryId || "");
			setCoverImage(
				loadedProduct.thumbnailUrl || loadedProduct.thumbnailUrl || "",
			);
			setVideoUrl(loadedProduct.videoUrl || "");
			setImageUrls(loadedProduct.imageUrls || []);

			setWeight(loadedProduct.weight);
			setLength(loadedProduct.length);
			setWidth(loadedProduct.width);
			setHeight(loadedProduct.height);

			setSimplePrice(loadedProduct.price || 0);
			setSimpleDiscountPrice(loadedProduct.discountPrice || 0);
			setSimpleStock(loadedProduct.availableStock || 0);

			const hasOpts =
				loadedProduct.options && loadedProduct.options.length > 0;
			setEnableVariants(hasOpts);

			if (hasOpts) {
				isLoadedFromDb.current = true;
				const mappedOptions = loadedProduct.options.map((opt) => ({
					id: opt.id,
					name: opt.name,
					values: opt.values.map((v) => ({
						id: v.id,
						value: v.value,
						imageUrl: v.imageUrl,
					})),
				}));
				setOptions(mappedOptions);

				const mappedVariants = loadedProduct.variants.map((v) => {
					const optionValues = v.variantOptions
						.map((vo) => {
							let optionName = "";
							let valueName = "";
							let optSortOrder = 0;
							let valSortOrder = 0;

							for (const opt of loadedProduct.options) {
								const matchedVal = opt.values.find(
									(val) => val.id === vo.optionValueId,
								);
								if (matchedVal) {
									optionName = opt.name;
									valueName = matchedVal.value;
									optSortOrder = opt.sortOrder;
									valSortOrder = matchedVal.sortOrder;
									break;
								}
							}
							return {
								optionName,
								valueName,
								optSortOrder,
								valSortOrder,
							};
						})
						.sort((a, b) => {
							if (a.optSortOrder !== b.optSortOrder) {
								return a.optSortOrder - b.optSortOrder;
							}
							return a.valSortOrder - b.valSortOrder;
						})
						.map(({ optionName, valueName }) => ({
							optionName,
							valueName,
						}));

					return {
						id: v.id,
						sku: v.sku || "",
						price: v.price,
						discountPrice: v.discountPrice,
						stock: v.availableStock,
						weight: v.weight || 0,
						length: v.length || 0,
						width: v.width || 0,
						height: v.height || 0,
						optionValues,
					};
				});

				setGeneratedVariants(mappedVariants);
			} else {
				setOptions([]);
				const singleV = loadedProduct.variants?.[0];
				setGeneratedVariants(
					singleV
						? [
							{
								id: singleV.id,
								sku: singleV.sku || "",
								price: singleV.price,
								discountPrice: singleV.discountPrice,
								stock: singleV.availableStock,
								weight: singleV.weight || 0,
								length: singleV.length || 0,
								width: singleV.width || 0,
								height: singleV.height || 0,
								optionValues: [],
							},
						]
						: [],
				);
			}
		}
	}, [loadedProduct, isNew]);

	useEffect(() => {
		if (!enableVariants) return;
		if (isLoadedFromDb.current) {
			isLoadedFromDb.current = false;
			return;
		}
		if (options.length === 0) {
			setGeneratedVariants([]);
			return;
		}

		const validOptions = options.filter((opt) => opt.values.length > 0);
		if (validOptions.length === 0) {
			setGeneratedVariants([]);
			return;
		}

		// Tạo tổ hợp các giá trị mới từ các option hiện tại
		const valueCombos = cartesianProduct(
			validOptions.map((opt) => opt.values),
		);

		setGeneratedVariants((prevVariants) => {
			return valueCombos.map((combo) => {
				const optComboDetails = combo.map((val, idx) => ({
					optionName: validOptions[idx].name,
					valueName: val.value,
				}));

				// Tạo key dựa trên tập hợp giá trị của option mới
				const makeKey = (
					arr: { optionName: string; valueName: string }[],
				) =>
					arr
						.map(
							(x) =>
								`${x.optionName.trim().toLowerCase()}:${x.valueName.trim().toLowerCase()}`,
						)
						.sort()
						.join("|");

				const currentKey = makeKey(optComboDetails);

				// Chỉ tận dụng lại giá thế (giá, kho, sku, id...) của biến thể cũ NẾU NHƯ cấu trúc optionValues khớp hoàn toàn
				const existing = prevVariants.find(
					(gv) => makeKey(gv.optionValues) === currentKey,
				);

				return {
					id: existing?.id, // Giữ lại ID cũ nếu có để BE biết đường update
					sku: existing?.sku || "",
					price: existing?.price || 0,
					discountPrice: existing?.discountPrice,
					stock: existing?.stock || 0,
					weight: existing?.weight || 0,
					length: existing?.length || 0,
					width: existing?.width || 0,
					height: existing?.height || 0,
					optionValues: optComboDetails, // Đảm bảo số lượng optionValues sẽ khớp 100% với số lượng options hiện tại
				};
			});
		});
	}, [options, enableVariants]);

	const handleAddOption = () => {
		if (options.length >= 2) {
			toast.warning("Chỉ được phép thiết lập tối đa 2 nhóm phân loại.");
			return;
		}
		setOptions([
			...options,
			{ name: `Phân loại ${options.length + 1}`, values: [] },
		]);
	};

	const handleRemoveOption = (index: number) => {
		const option = options[index];
		const hasActiveIds = generatedVariants.some(
			(v) =>
				v.id &&
				v.optionValues.some((ov) => ov.optionName === option.name),
		);

		if (hasActiveIds) {
			const confirm = window.confirm(
				"Xóa phân loại này sẽ làm thay đổi cấu trúc biến thể và xóa toàn bộ dữ liệu biến thể hiện tại trên hệ thống. Bạn có chắc chắn muốn thực hiện?",
			);
			if (!confirm) return;
		}

		setOptions(options.filter((_, i) => i !== index));
	};

	const handleAddOptionValue = (optIndex: number, valueText: string) => {
		if (!valueText.trim()) return;

		const opt = options[optIndex];
		if (
			opt.values.some(
				(v) => v.value.toLowerCase() === valueText.trim().toLowerCase(),
			)
		) {
			toast.error("Giá trị phân loại này đã tồn tại.");
			return;
		}

		const updatedOptions = [...options];
		updatedOptions[optIndex].values.push({ value: valueText.trim() });
		setOptions(updatedOptions);
	};

	const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
		const option = options[optIndex];
		const value = option.values[valIndex];

		const hasActiveId = generatedVariants.some(
			(v) =>
				v.id &&
				v.optionValues.some(
					(ov) =>
						ov.optionName === option.name &&
						ov.valueName === value.value,
				),
		);

		if (hasActiveId) {
			const confirm = window.confirm(
				`Giá trị phân loại "${value.value}" hiện đang có biến thể hoạt động trên hệ thống. Bạn có chắc chắn muốn xóa giá trị này?`,
			);
			if (!confirm) return;
		}

		const updatedOptions = [...options];
		updatedOptions[optIndex].values.splice(valIndex, 1);
		setOptions(updatedOptions);
	};

	const handleUpdateOptionName = (index: number, name: string) => {
		const updatedOptions = [...options];
		updatedOptions[index].name = name;
		setOptions(updatedOptions);
	};

	const handleUpdateVariantField = (
		varIndex: number,
		field:
			| "sku"
			| "price"
			| "discountPrice"
			| "stock"
			| "weight"
			| "length"
			| "width"
			| "height",
		val: any,
	) => {
		const updatedVariants = [...generatedVariants];
		if (field === "sku") {
			updatedVariants[varIndex].sku = val;
		} else if (field === "price") {
			updatedVariants[varIndex].price = Number(val);
		} else if (field === "discountPrice") {
			updatedVariants[varIndex].discountPrice = val
				? Number(val)
				: undefined;
		} else if (field === "stock") {
			updatedVariants[varIndex].stock = Number(val);
		} else if (field === "weight") {
			updatedVariants[varIndex].weight = Number(val);
		} else if (field === "length") {
			updatedVariants[varIndex].length = Number(val);
		} else if (field === "width") {
			updatedVariants[varIndex].width = Number(val);
		} else if (field === "height") {
			updatedVariants[varIndex].height = Number(val);
		}
		setGeneratedVariants(updatedVariants);
	};

	const handleSave = async () => {
		if (!productId) return;

		try {
			if (activeSection === "basic") {
				await updateProductMutation.mutateAsync({
					id: productId,
					payload: {
						name,
						description,
						thumbnailUrl: coverImage,
						videoUrl,
						imageUrls,
						categoryId: categoryId || undefined,
					},
				});
			} else {
				if (!enableVariants) {
					await updateProductSaleMutation.mutateAsync({
						id: productId,
						payload: {
							price: simplePrice,
							availableStock: simpleStock,
							discountPrice:
								simpleDiscountPrice <= 0
									? null
									: simpleDiscountPrice,
							weight,
							length,
							width,
							height,
						},
					});
				} else {
					// Đã bổ sung truyền dữ liệu options đầy đủ theo yêu cầu BE
					await bulkUpdateVariantsMutation.mutateAsync({
						id: productId,
						payload: {
							options: options.map((opt) => ({
								id: opt.id || null,
								name: opt.name,
								values: opt.values.map((val) => ({
									id: val.id || null,
									value: val.value,
									imageUrl: val.imageUrl || null,
								})),
							})),
							variants: generatedVariants.map((gv) => {
								const optionValuesWithImages =
									gv.optionValues.map((ov) => {
										const matchedOpt = options.find(
											(opt) => opt.name === ov.optionName,
										);
										const matchedVal =
											matchedOpt?.values.find(
												(val) =>
													val.value === ov.valueName,
											);
										return {
											optionName: ov.optionName,
											valueName: ov.valueName,
										};
									});

								return {
									id: gv.id || null,
									sku: gv.sku || null,
									price: gv.price,
									availableStock: gv.stock,
									optionValues: optionValuesWithImages,
									weight: gv.weight || 0,
									length: gv.length || 0,
									width: gv.width || 0,
									height: gv.height || 0,
									discountPrice:
										gv.discountPrice && gv.discountPrice > 0
											? gv.discountPrice
											: null,
								};
							}),
						},
					});
				}
			}

			toast.success("Cập nhật thông tin sản phẩm thành công!");
		} catch (err: any) {
			toast.error(`Cập nhật thất bại: ${err?.message || "Lỗi hệ thống"}`);
		}
	};

	// Khắc phục lỗi isSaving bằng cách lọc bỏ các biến mutation không tồn tại
	const isSaving =
		updateProductMutation.isPending ||
		updateProductSaleMutation.isPending ||
		bulkUpdateVariantsMutation.isPending;

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin sản phẩm...
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-5 text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
				Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.
			</div>
		);
	}

	return (
		<div className="flex gap-6 text-left relative pb-20 font-sans">
			{/* Sub-Sidebar */}
			<aside className="w-48 bg-white border border-brand-border rounded-xl p-3.5 shrink-0 h-fit sticky top-20 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
				<nav className="space-y-1.5 text-xs">
					<button
						onClick={() => setActiveSection("basic")}
						className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeSection === "basic"
								? "bg-brand-primary/10 text-brand-primary-deep"
								: "hover:bg-brand-light-soft text-brand-muted"
							}`}
					>
						Thông tin cơ bản
					</button>
					<button
						onClick={() => setActiveSection("variants")}
						className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeSection === "variants"
								? "bg-brand-primary/10 text-brand-primary-deep"
								: "hover:bg-brand-light-soft text-brand-muted"
							}`}
					>
						Thông tin bán hàng
					</button>
				</nav>
			</aside>

			{/* Form Content Area */}
			<div className="flex-1 space-y-6">
				{activeSection === "basic" ? (
					<ProductBasicInfoSection
						name={name}
						setName={setName}
						description={description}
						setDescription={setDescription}
						coverImage={coverImage}
						setCoverImage={setCoverImage}
						imageUrls={imageUrls}
						setImageUrls={setImageUrls}
						videoUrl={videoUrl}
						setVideoUrl={setVideoUrl}
						categoryId={categoryId}
						setCategoryId={setCategoryId}
					/>
				) : (
					<VariantsSection
						enableVariants={enableVariants}
						setEnableVariants={setEnableVariants}
						options={options}
						setOptions={setOptions}
						generatedVariants={generatedVariants}
						setGeneratedVariants={setGeneratedVariants}
						handleAddOption={handleAddOption}
						handleRemoveOption={handleRemoveOption}
						handleAddOptionValue={handleAddOptionValue}
						handleRemoveOptionValue={handleRemoveOptionValue}
						handleUpdateOptionName={handleUpdateOptionName}
						handleUpdateVariantField={handleUpdateVariantField}
						simplePrice={simplePrice}
						setSimplePrice={setSimplePrice}
						simpleDiscountPrice={simpleDiscountPrice}
						setSimpleDiscountPrice={setSimpleDiscountPrice}
						simpleStock={simpleStock}
						setSimpleStock={setSimpleStock}
					/>
				)}
			</div>

			{/* Floating Controls */}
			<div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white border border-brand-border p-3 rounded-xl shadow-lg shadow-gray-200/50">
				<button
					type="button"
					onClick={() =>
						navigate(
							`/seller/${shopId || "default"}/dashboard/products/list`,
						)
					}
					className="h-9 px-4 border border-brand-border text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark font-semibold rounded-lg text-xs transition-colors cursor-pointer"
				>
					Hủy bỏ
				</button>
				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="h-9 px-5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 transition-colors"
				>
					{isSaving ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : (
						<Save className="w-3.5 h-3.5" />
					)}
					Lưu thông tin
				</button>
			</div>
		</div>
	);
}
