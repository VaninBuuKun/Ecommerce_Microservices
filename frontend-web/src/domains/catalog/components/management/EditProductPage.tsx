import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
	catalogQueryKeys,
	useProductByIdQuery,
	useUpdateMultiVariantsMutation,
	useUpdateProductMutation,
	useUpdateSingleVariantMutation,
	useDeleteProductVariantMutation,
	useDeleteProductOptionMutation,
	useDeleteProductOptionValueMutation,
} from "../../hooks/useCatalog";
import { useSellerProfileQuery, useSellerStore } from "@/domains/seller";
import {
	VariantsSection,
	type GeneratedVariantType,
	type OptionType,
} from "./ProductVariantSection";
import { ProductBasicInfoSection, type AttributeItem } from "./ProductBasicInfoSection";
import { ShippingInfoCard } from "./ShippingInfoCard";
import { VariantSwitchWarningModal } from "./VariantSwitchWarningModal";
import { DeleteEntityModal } from "./DeleteEntityModal";
import { DiscardChangesModal } from "./DiscardChangesModal";

function cartesianProduct<T>(arrays: T[][]): T[][] {
	return arrays.reduce<T[][]>(
		(acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
		[[]],
	);
}

interface BasicSnapshot {
	name: string;
	description: string;
	coverImage: string;
	videoUrl: string;
	imageUrls: string[];
	categoryId: number | null;
	attributes: AttributeItem[];
	weight: number;
	length: number;
	width: number;
	height: number;
}

interface VariantsSnapshot {
	enableVariants: boolean;
	simplePrice: number;
	simpleDiscountPrice: number;
	simpleStock: number;
	options: OptionType[];
	generatedVariants: GeneratedVariantType[];
}

export function EditProductPage() {
	const { productId, shopId } = useParams<{
		productId: string;
		shopId: string;
	}>();
	const navigate = useNavigate();
	const { activeShop } = useSellerStore();
	const { data: profile, isLoading: isProfileLoading } = useSellerProfileQuery();
	const shops = profile?.shops ?? [];
	const resolvedShop =
		activeShop ??
		shops.find((shop: any) => String(shop.id) === shopId) ??
		shops[0] ??
		null;
	const numericShopId = resolvedShop?.id ? Number(resolvedShop.id) : 0;

	const isNew = productId === "new";
	const targetProductId = isNew || !productId ? undefined : productId;
	const queryClient = useQueryClient();
	const {
		data: loadedProduct,
		isLoading,
		isError,
	} = useProductByIdQuery(targetProductId);

	const updateProductMutation = useUpdateProductMutation();
	const updateSingleVariantMutation = useUpdateSingleVariantMutation();
	const updateMultiVariantsMutation = useUpdateMultiVariantsMutation();
	const deleteVariantMutation = useDeleteProductVariantMutation();
	const deleteOptionMutation = useDeleteProductOptionMutation();
	const deleteOptionValueMutation = useDeleteProductOptionValueMutation();

	const [activeSection, setActiveSection] = useState<"basic" | "variants">(
		"basic",
	);

	// Basic Info State
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [categoryId, setCategoryId] = useState<number | null>(null);
	const [attributes, setAttributes] = useState<AttributeItem[]>([]);
	const [attributeErrors, setAttributeErrors] = useState<
		Record<number, { key?: boolean; value?: boolean }>
	>({});

	// Shipping State (Product Level)
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
	const [initialHasVariants, setInitialHasVariants] = useState<boolean | null>(null);
	const [isSwitchWarningOpen, setIsSwitchWarningOpen] = useState(false);

	const [options, setOptions] = useState<OptionType[]>([]);
	const [generatedVariants, setGeneratedVariants] = useState<
		GeneratedVariantType[]
	>([]);
	const generatedVariantsRef = useRef(generatedVariants);
	generatedVariantsRef.current = generatedVariants;
	const isLoadedFromDb = useRef(false);

	// Snapshots for Dirty State Tracking
	const basicBaseline = useRef<BasicSnapshot | null>(null);
	const variantsBaseline = useRef<VariantsSnapshot | null>(null);

	// Modal Discard Changes
	const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

	// Modal Xóa có kiểm soát
	const [deleteModal, setDeleteModal] = useState<{
		isOpen: boolean;
		type: "variant" | "option" | "optionValue";
		id: string;
		name: string;
		optIdx?: number;
		valIdx?: number;
		varIdx?: number;
	} | null>(null);

	useEffect(() => {
		if (loadedProduct && !isNew) {
			setName(loadedProduct.name);
			setDescription(loadedProduct.description || "");
			setCategoryId(loadedProduct.categoryId ? Number(loadedProduct.categoryId) : null);
			setCoverImage(loadedProduct.thumbnailUrl || "");
			setVideoUrl(loadedProduct.videoUrl || "");
			setImageUrls(loadedProduct.imageUrls || []);

			let parsedAttributes: AttributeItem[] = [];
			if (loadedProduct.attributesJson) {
				try {
					const parsed = JSON.parse(loadedProduct.attributesJson);
					if (Array.isArray(parsed)) {
						parsedAttributes = parsed.filter((item: any) => item.key || item.value);
					}
				} catch {
					parsedAttributes = [];
				}
			}
			setAttributes(parsedAttributes);

			setWeight(loadedProduct.weight || 0);
			setLength(loadedProduct.length || 0);
			setWidth(loadedProduct.width || 0);
			setHeight(loadedProduct.height || 0);

			setSimplePrice(loadedProduct.price || 0);
			setSimpleDiscountPrice(loadedProduct.discountPrice || 0);
			setSimpleStock(loadedProduct.availableStock || 0);

			const hasOpts =
				loadedProduct.options && loadedProduct.options.length > 0;
			setEnableVariants(hasOpts);
			setInitialHasVariants(hasOpts);

			let mappedOptions: OptionType[] = [];
			let mappedVariants: GeneratedVariantType[] = [];

			if (hasOpts) {
				isLoadedFromDb.current = true;
				mappedOptions = (loadedProduct.options || [])
					.slice()
					.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
					.map((opt: any) => ({
						id: opt.id ? String(opt.id) : undefined,
						name: opt.name,
						values: (opt.values || [])
							.slice()
							.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
							.map((v: any) => ({
								id: v.id ? String(v.id) : undefined,
								value: v.value,
								imageUrl: v.imageUrl,
							})),
					}));
				setOptions(mappedOptions);

				mappedVariants = (loadedProduct.variants || []).map((v: any) => {
					const optionValues = (v.variantOptions || [])
						.map((vo: any) => {
							let optionName = "";
							let valueName = "";
							let optSortOrder = 0;
							let valSortOrder = 0;

							for (const opt of loadedProduct.options) {
								const matchedVal = (opt.values || []).find(
									(val: any) => String(val.id) === String(vo.optionValueId),
								);
								if (matchedVal) {
									optionName = opt.name;
									valueName = matchedVal.value;
									optSortOrder = opt.sortOrder ?? 0;
									valSortOrder = matchedVal.sortOrder ?? 0;
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
						.sort((a: any, b: any) => {
							if (a.optSortOrder !== b.optSortOrder) {
								return a.optSortOrder - b.optSortOrder;
							}
							return a.valSortOrder - b.valSortOrder;
						})
						.map(({ optionName, valueName }: any) => ({
							optionName,
							valueName,
						}));

					return {
						id: v.id ? String(v.id) : undefined,
						sku: v.sku || "",
						price: v.price,
						discountPrice: v.discountPrice,
						stock: v.availableStock,
						optionValues,
					};
				});

				// Sort mappedVariants to Cartesian order of mappedOptions
				const validOptionArrays = mappedOptions
					.filter((opt) => opt.values.length > 0)
					.map((opt) =>
						opt.values.map((v) => ({
							optionName: opt.name,
							valueName: v.value,
						})),
					);
				const loadedCombos = cartesianProduct(validOptionArrays);
				const sortedVariants = loadedCombos
					.map((combo) =>
						mappedVariants.find(
							(v) =>
								v.optionValues.length === combo.length &&
								combo.every((c) =>
									v.optionValues.some(
										(ov) =>
											ov.optionName.trim().toLowerCase() ===
												c.optionName.trim().toLowerCase() &&
											ov.valueName.trim().toLowerCase() ===
												c.valueName.trim().toLowerCase(),
									),
								),
						),
					)
					.filter((v): v is GeneratedVariantType => v !== undefined);

				setGeneratedVariants(sortedVariants.length > 0 ? sortedVariants : mappedVariants);
			} else {
				setOptions([]);
				const singleV = loadedProduct.variants?.[0];
				mappedVariants = singleV
					? [
						{
							id: singleV.id ? String(singleV.id) : undefined,
							sku: singleV.sku || "",
							price: singleV.price,
							discountPrice: singleV.discountPrice,
							stock: singleV.availableStock,
							optionValues: [],
						},
					]
					: [];
				setGeneratedVariants(mappedVariants);
			}

			// Capture baselines for dirty tracking
			basicBaseline.current = {
				name: loadedProduct.name,
				description: loadedProduct.description || "",
				coverImage: loadedProduct.thumbnailUrl || "",
				videoUrl: loadedProduct.videoUrl || "",
				imageUrls: loadedProduct.imageUrls || [],
				categoryId: loadedProduct.categoryId ? Number(loadedProduct.categoryId) : null,
				attributes: JSON.parse(JSON.stringify(parsedAttributes)),
				weight: loadedProduct.weight || 0,
				length: loadedProduct.length || 0,
				width: loadedProduct.width || 0,
				height: loadedProduct.height || 0,
			};

			variantsBaseline.current = {
				enableVariants: hasOpts,
				simplePrice: loadedProduct.price || 0,
				simpleDiscountPrice: loadedProduct.discountPrice || 0,
				simpleStock: loadedProduct.availableStock || 0,
				options: JSON.parse(JSON.stringify(mappedOptions)),
				generatedVariants: JSON.parse(JSON.stringify(mappedVariants)),
			};
		}
	}, [loadedProduct, isNew]);

	// Dirty tracking memo
	const isBasicDirty = useMemo(() => {
		if (!basicBaseline.current) return false;
		const b = basicBaseline.current;
		if (name !== b.name) return true;
		if (description !== b.description) return true;
		if (coverImage !== b.coverImage) return true;
		if (videoUrl !== b.videoUrl) return true;
		if (categoryId !== b.categoryId) return true;
		if (weight !== b.weight || length !== b.length || width !== b.width || height !== b.height)
			return true;
		if (JSON.stringify(imageUrls) !== JSON.stringify(b.imageUrls)) return true;
		if (JSON.stringify(attributes) !== JSON.stringify(b.attributes)) return true;
		return false;
	}, [name, description, coverImage, videoUrl, categoryId, weight, length, width, height, imageUrls, attributes]);

	const isVariantsDirty = useMemo(() => {
		if (!variantsBaseline.current) return false;
		const b = variantsBaseline.current;
		if (enableVariants !== b.enableVariants) return true;
		if (!enableVariants) {
			if (simplePrice !== b.simplePrice) return true;
			if (simpleDiscountPrice !== b.simpleDiscountPrice) return true;
			if (simpleStock !== b.simpleStock) return true;
			return false;
		}

		if (JSON.stringify(options) !== JSON.stringify(b.options)) return true;

		const cleanCurrent = generatedVariants.map((v) => ({
			id: v.id,
			sku: v.sku || "",
			price: v.price,
			discountPrice: v.discountPrice,
			stock: v.stock,
			optionValues: v.optionValues,
		}));
		const cleanBaseline = b.generatedVariants.map((v) => ({
			id: v.id,
			sku: v.sku || "",
			price: v.price,
			discountPrice: v.discountPrice,
			stock: v.stock,
			optionValues: v.optionValues,
		}));

		return JSON.stringify(cleanCurrent) !== JSON.stringify(cleanBaseline);
	}, [enableVariants, simplePrice, simpleDiscountPrice, simpleStock, options, generatedVariants]);

	// Automatically re-generate Cartesian product variants when options or option values change/reorder
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

		const optionArrays = validOptions.map((opt) =>
			opt.values.map((v) => ({
				optionName: opt.name,
				valueName: v.value,
			})),
		);

		const combinations = cartesianProduct(optionArrays);

		// If variants already exist, only re-order existing variants without reviving deleted/missing combinations
		if (generatedVariantsRef.current.length > 0) {
			const reordered = combinations
				.map((combo) => {
					const existing = generatedVariantsRef.current.find(
						(v) =>
							v.optionValues.length === combo.length &&
							combo.every((c) =>
								v.optionValues.some(
									(ov) =>
										ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
								),
							),
					);
					if (!existing) return null;
					return {
						...existing,
						optionValues: combo,
					};
				})
				.filter((v): v is GeneratedVariantType => v !== null);

			setGeneratedVariants(reordered);
			return;
		}

		// Initial creation when no variants exist yet
		const newGenerated = combinations.map((combo) => ({
			sku: "",
			price: simplePrice || 0,
			discountPrice: simpleDiscountPrice > 0 ? simpleDiscountPrice : undefined,
			stock: simpleStock || 0,
			optionValues: combo,
		}));

		setGeneratedVariants(newGenerated);
	}, [options, enableVariants]);

	// --- Handlers: Option & Value & Variant Management ---
	const handleAddOption = () => {
		if (options.length >= 2) {
			toast.info("Chỉ hỗ trợ tối đa 2 nhóm phân loại.");
			return;
		}
		setOptions([...options, { name: "", values: [] }]);
	};

	const handleRemoveOption = (optIndex: number) => {
		const opt = options[optIndex];
		if (!opt.id) {
			setOptions((prev) => prev.filter((_, idx) => idx !== optIndex));
			return;
		}

		setDeleteModal({
			isOpen: true,
			type: "option",
			id: opt.id,
			name: opt.name || `Nhóm ${optIndex + 1}`,
			optIdx: optIndex,
		});
	};

	// Reorder 2 options (Move Up / Down)
	const handleMoveOption = (fromIndex: number, toIndex: number) => {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= options.length ||
			toIndex >= options.length
		)
			return;
		const updatedOptions = [...options];
		const [moved] = updatedOptions.splice(fromIndex, 1);
		updatedOptions.splice(toIndex, 0, moved);
		setOptions(updatedOptions);

		// Reorder existing variants to match the new option order
		const validOptionArrays = updatedOptions
			.filter((opt) => opt.values.length > 0)
			.map((opt) =>
				opt.values.map((v) => ({
					optionName: opt.name,
					valueName: v.value,
				})),
			);
		const newCombos = cartesianProduct(validOptionArrays);
		setGeneratedVariants((prevVariants) => {
			return newCombos
				.map((combo) => {
					const existing = prevVariants.find(
						(v) =>
							v.optionValues.length === combo.length &&
							combo.every((c) =>
								v.optionValues.some(
									(ov) =>
										ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
								),
							),
					);
					if (!existing) return null;
					return {
						...existing,
						optionValues: combo,
					};
				})
				.filter((v): v is GeneratedVariantType => v !== null);
		});
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

		// Check 60 variants limit:
		const opt1Count = optIndex === 0 ? opt.values.length + 1 : (options[0]?.values.length || 1);
		const opt2Count = options.length > 1
			? (optIndex === 1 ? opt.values.length + 1 : (options[1]?.values.length || 1))
			: 1;
		const potentialCount = opt1Count * opt2Count;
		if (potentialCount > 60) {
			toast.error(`Không thể thêm giá trị phân loại. Giới hạn tối đa là 60 biến thể cho mỗi sản phẩm (thêm giá trị này sẽ tạo ra ${potentialCount} biến thể).`);
			return;
		}

		const updatedOptions = [...options];
		const newValueObj = { value: valueText.trim() };
		updatedOptions[optIndex] = {
			...opt,
			values: [...opt.values, newValueObj],
		};
		setOptions(updatedOptions);

		// If other options exist, generate combinations for this new value
		const validOptionArrays = updatedOptions
			.filter((o) => o.values.length > 0)
			.map((o) =>
				o.values.map((v) => ({
					optionName: o.name,
					valueName: v.value,
				})),
			);
		const allCombos = cartesianProduct(validOptionArrays);

		// Filter for combos that specifically include the newly added value
		const newCombosForThisValue = allCombos.filter((combo) =>
			combo.some(
				(c) =>
					c.optionName === opt.name &&
					c.valueName.toLowerCase() === valueText.trim().toLowerCase(),
			),
		);

		const newVariants: GeneratedVariantType[] = newCombosForThisValue.map((combo) => ({
			sku: "",
			price: simplePrice || 0,
			discountPrice: simpleDiscountPrice > 0 ? simpleDiscountPrice : undefined,
			stock: simpleStock || 0,
			optionValues: combo,
		}));

		const combined = [...generatedVariants, ...newVariants];

		// Keep in Cartesian product order
		const sorted = allCombos
			.map((combo) =>
				combined.find(
					(v) =>
						v.optionValues.length === combo.length &&
						combo.every((c) =>
							v.optionValues.some(
								(ov) =>
									ov.optionName.trim().toLowerCase() ===
										c.optionName.trim().toLowerCase() &&
									ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
							),
						),
				),
			)
			.filter((v): v is GeneratedVariantType => v !== undefined);

		setGeneratedVariants(sorted);
	};

	const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
		const option = options[optIndex];
		const value = option.values[valIndex];

		if (!value.id) {
			const updatedOptions = [...options];
			updatedOptions[optIndex].values.splice(valIndex, 1);
			setOptions(updatedOptions);
			return;
		}

		setDeleteModal({
			isOpen: true,
			type: "optionValue",
			id: value.id,
			name: value.value,
			optIdx: optIndex,
			valIdx: valIndex,
		});
	};

	// Reorder option values within the same option
	const handleMoveOptionValue = (
		optIndex: number,
		fromValIndex: number,
		toValIndex: number,
	) => {
		const opt = options[optIndex];
		if (
			!opt ||
			fromValIndex === toValIndex ||
			fromValIndex < 0 ||
			toValIndex < 0 ||
			fromValIndex >= opt.values.length ||
			toValIndex >= opt.values.length
		)
			return;
		const updatedOptions = [...options];
		const updatedValues = [...opt.values];
		const [moved] = updatedValues.splice(fromValIndex, 1);
		updatedValues.splice(toValIndex, 0, moved);
		updatedOptions[optIndex] = { ...opt, values: updatedValues };
		setOptions(updatedOptions);

		// Reorder existing variants to match the new value order
		const validOptionArrays = updatedOptions
			.filter((o) => o.values.length > 0)
			.map((o) =>
				o.values.map((v) => ({
					optionName: o.name,
					valueName: v.value,
				})),
			);
		const newCombos = cartesianProduct(validOptionArrays);
		setGeneratedVariants((prevVariants) => {
			return newCombos
				.map((combo) => {
					const existing = prevVariants.find(
						(v) =>
							v.optionValues.length === combo.length &&
							combo.every((c) =>
								v.optionValues.some(
									(ov) =>
										ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
								),
							),
					);
					if (!existing) return null;
					return {
						...existing,
						optionValues: combo,
					};
				})
				.filter((v): v is GeneratedVariantType => v !== null);
		});
	};

	const handleRemoveVariant = (varIndex: number) => {
		const v = generatedVariants[varIndex];
		if (!v.id) {
			setGeneratedVariants((prev) => prev.filter((_, i) => i !== varIndex));
			return;
		}

		const variantName =
			v.optionValues.map((ov) => ov.valueName).join(" - ") ||
			`Biến thể ${varIndex + 1}`;
		setDeleteModal({
			isOpen: true,
			type: "variant",
			id: v.id,
			name: variantName,
			varIdx: varIndex,
		});
	};

	const handleConfirmDeleteModal = async () => {
		if (!deleteModal || !targetProductId) return;

		try {
			if (deleteModal.type === "variant") {
				await deleteVariantMutation.mutateAsync({
					productId: targetProductId,
					variantId: deleteModal.id,
				});
				setGeneratedVariants((prev) =>
					prev.filter((_, i) => i !== deleteModal.varIdx),
				);
				toast.success("Xóa biến thể thành công!");
			} else if (deleteModal.type === "option") {
				await deleteOptionMutation.mutateAsync({
					productId: targetProductId,
					optionId: deleteModal.id,
				});
				setOptions((prev) =>
					prev.filter((_, i) => i !== deleteModal.optIdx),
				);
				toast.success("Xóa nhóm phân loại thành công!");
			} else if (deleteModal.type === "optionValue") {
				const opt = options[deleteModal.optIdx!];
				if (opt?.id) {
					await deleteOptionValueMutation.mutateAsync({
						productId: targetProductId,
						optionId: opt.id,
						valueId: deleteModal.id,
					});
				}
				const updated = [...options];
				updated[deleteModal.optIdx!].values.splice(deleteModal.valIdx!, 1);
				setOptions(updated);
				toast.success("Xóa giá trị phân loại thành công!");
			}
			setDeleteModal(null);
		} catch (err: any) {
			const msg =
				err.response?.data?.message ||
				err.response?.data ||
				err?.message ||
				"Xóa thất bại";
			toast.error(`Thao tác thất bại: ${msg}`);
		}
	};

	const handleUpdateOptionName = (index: number, name: string) => {
		const updatedOptions = [...options];
		updatedOptions[index].name = name;
		setOptions(updatedOptions);
	};

	const handleUpdateVariantField = (
		varIndex: number,
		field: "sku" | "price" | "discountPrice" | "stock",
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
		}
		setGeneratedVariants(updatedVariants);
	};

	// --- Save Product Handlers By Tab ---
	const handleSaveBasic = async () => {
		if (!targetProductId) return;

		// 1. Validate Attributes: Ensure all attributes have both key and value
		const attrErrs: Record<number, { key?: boolean; value?: boolean }> = {};
		let hasAttrErr = false;
		attributes.forEach((attr, idx) => {
			const kEmpty = !attr.key.trim();
			const vEmpty = !attr.value.trim();
			if (kEmpty || vEmpty) {
				attrErrs[idx] = { key: kEmpty, value: vEmpty };
				hasAttrErr = true;
			}
		});

		if (hasAttrErr) {
			setAttributeErrors(attrErrs);
			toast.error(
				"Vui lòng điền đầy đủ Tên thuộc tính và Giá trị cho tất cả các thông số (hoặc bấm biểu tượng thùng rác để xóa dòng chưa hoàn tất).",
			);
			return;
		}
		setAttributeErrors({});

		if (!name.trim()) {
			toast.error("Vui lòng nhập tên sản phẩm.");
			return;
		}
		if (!description.trim()) {
			toast.error("Vui lòng nhập mô tả sản phẩm.");
			return;
		}
		if (!coverImage) {
			toast.error("Vui lòng tải lên ảnh bìa sản phẩm.");
			return;
		}
		if (!categoryId) {
			toast.error("Vui lòng chọn danh mục con cho sản phẩm.");
			return;
		}

		try {
			const validAttrs = attributes.filter(
				(a) => a.key.trim() && a.value.trim(),
			);
			const attributesJson =
				validAttrs.length > 0 ? JSON.stringify(validAttrs) : undefined;

			await updateProductMutation.mutateAsync({
				id: targetProductId,
				payload: {
					name,
					description,
					thumbnailUrl: coverImage,
					videoUrl,
					imageUrls,
					categoryId: categoryId ? Number(categoryId) : undefined,
					attributesJson,
					weight,
					length,
					width,
					height,
				},
			});

			// Update baseline for basic info
			basicBaseline.current = {
				name,
				description,
				coverImage,
				videoUrl,
				imageUrls: [...imageUrls],
				categoryId,
				attributes: JSON.parse(JSON.stringify(attributes)),
				weight,
				length,
				width,
				height,
			};

			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
			toast.success("Cập nhật thông tin cơ bản và vận chuyển thành công!");
		} catch (err: any) {
			const msg =
				err.response?.data?.message ||
				err.response?.data ||
				err?.message ||
				"Lỗi hệ thống";
			toast.error(`Cập nhật thất bại: ${msg}`);
		}
	};

	const executeSaveVariants = async () => {
		if (!targetProductId) return;

		try {
			if (!enableVariants) {
				await updateSingleVariantMutation.mutateAsync({
					id: targetProductId,
					payload: {
						price: simplePrice,
						availableStock: simpleStock,
						discountPrice:
							simpleDiscountPrice <= 0 ? null : simpleDiscountPrice,
						weight,
						length,
						width,
						height,
					},
				});
			} else {
				if (
					options.length === 0 ||
					options.some((o) => !o.name.trim() || o.values.length === 0)
				) {
					toast.error(
						"Vui lòng điền đầy đủ tên nhóm phân loại và ít nhất một giá trị phân loại.",
					);
					return;
				}

				if (generatedVariants.length > 60) {
					toast.error("Một sản phẩm chỉ hỗ trợ tối đa 60 biến thể. Vui lòng giảm bớt biến thể trước khi lưu.");
					return;
				}

				await updateMultiVariantsMutation.mutateAsync({
					id: targetProductId,
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
						variants: generatedVariants.map((gv) => ({
							id: gv.id || null,
							price: gv.price,
							availableStock: gv.stock,
							discountPrice:
								gv.discountPrice && gv.discountPrice > 0
									? gv.discountPrice
									: null,
							optionValues: gv.optionValues.map((ov) => ({
								optionName: ov.optionName,
								valueName: ov.valueName,
							})),
						})),
						weight,
						length,
						width,
						height,
					},
				});
			}

			// Update baseline for variants
			variantsBaseline.current = {
				enableVariants,
				simplePrice,
				simpleDiscountPrice,
				simpleStock,
				options: JSON.parse(JSON.stringify(options)),
				generatedVariants: JSON.parse(JSON.stringify(generatedVariants)),
			};
			setInitialHasVariants(enableVariants);
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
			toast.success("Cập nhật thông tin biến thể thành công!");
		} catch (err: any) {
			const msg =
				err.response?.data?.message ||
				err.response?.data ||
				err?.message ||
				"Lỗi hệ thống";
			toast.error(`Cập nhật thất bại: ${msg}`);
		}
	};

	const handleSave = async () => {
		if (activeSection === "basic") {
			await handleSaveBasic();
		} else {
			const hasVariantsChanged =
				initialHasVariants !== null && initialHasVariants !== enableVariants;
			const isDismissed =
				localStorage.getItem("dismiss_variant_switch_warning") === "true";

			if (hasVariantsChanged && !isDismissed) {
				setIsSwitchWarningOpen(true);
				return;
			}

			await executeSaveVariants();
		}
	};

	const handleConfirmVariantSwitch = (dontShowAgain: boolean) => {
		if (dontShowAgain) {
			localStorage.setItem("dismiss_variant_switch_warning", "true");
		}
		setIsSwitchWarningOpen(false);
		executeSaveVariants();
	};

	const handleCancel = () => {
		if (isBasicDirty || isVariantsDirty) {
			setIsDiscardModalOpen(true);
		} else {
			navigate(`/seller/${shopId || "default"}/dashboard/products/list`);
		}
	};

	const isSaving =
		updateProductMutation.isPending ||
		updateSingleVariantMutation.isPending ||
		updateMultiVariantsMutation.isPending;

	const isCurrentTabDirty =
		activeSection === "basic" ? isBasicDirty : isVariantsDirty;

	if (isLoading || isProfileLoading) {
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

	const isOwnerOfProduct =
		!loadedProduct ||
		shops.some((s: any) => String(s.id) === String(loadedProduct?.shopId));
	if (loadedProduct && !isOwnerOfProduct) {
		return (
			<div className="p-8 text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl space-y-3 font-sans">
				<div className="font-bold text-sm">
					Bạn không có quyền chỉnh sửa sản phẩm này.
				</div>
				<p className="text-slate-600">
					Sản phẩm này thuộc về cửa hàng khác không nằm trong tài khoản người bán của bạn.
				</p>
				<button
					type="button"
					onClick={() =>
						navigate(
							`/seller/${numericShopId || "default"}/dashboard/products`,
						)
					}
					className="px-4 py-2 bg-brand-primary text-brand-dark rounded-lg font-bold cursor-pointer border-none shadow-xs hover:bg-brand-primary-deep transition-colors"
				>
					Quay lại danh sách sản phẩm
				</button>
			</div>
		);
	}

	return (
		<div className="flex gap-6 text-left relative pb-20 font-sans">
			{/* Sub-Sidebar */}
			<aside className="w-48 bg-white border border-brand-border rounded-xl p-3.5 shrink-0 h-fit sticky top-20 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
				<nav className="space-y-1.5 text-xs">
					<button
						type="button"
						onClick={() => setActiveSection("basic")}
						className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-between ${
							activeSection === "basic"
								? "bg-brand-primary/10 text-brand-primary-deep"
								: "hover:bg-brand-light-soft text-brand-muted"
						}`}
					>
						<span>Thông tin cơ bản</span>
						{isBasicDirty && (
							<span
								className="text-red-500 font-bold text-sm leading-none"
								title="Có thay đổi chưa lưu"
							>
								*
							</span>
						)}
					</button>
					<button
						type="button"
						onClick={() => setActiveSection("variants")}
						className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-between ${
							activeSection === "variants"
								? "bg-brand-primary/10 text-brand-primary-deep"
								: "hover:bg-brand-light-soft text-brand-muted"
						}`}
					>
						<span>Biến thể</span>
						{isVariantsDirty && (
							<span
								className="text-red-500 font-bold text-sm leading-none"
								title="Có thay đổi chưa lưu"
							>
								*
							</span>
						)}
					</button>
				</nav>
			</aside>

			{/* Form Content Area */}
			<div className="flex-1 space-y-6">
				{activeSection === "basic" ? (
					<div className="space-y-6">
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
							attributes={attributes}
							setAttributes={setAttributes}
							attributeErrors={attributeErrors}
						/>

						{/* Card Thông Tin Vận Chuyển Được Đưa Vào Tab Thông Tin Cơ Bản */}
						<ShippingInfoCard
							weight={weight}
							setWeight={setWeight}
							length={length}
							setLength={setLength}
							width={width}
							setWidth={setWidth}
							height={height}
							setHeight={setHeight}
						/>
					</div>
				) : (
					<div className="space-y-6">
						{/* Variants Section */}
						<VariantsSection
							enableVariants={enableVariants}
							setEnableVariants={setEnableVariants}
							options={options}
							setOptions={setOptions}
							generatedVariants={generatedVariants}
							setGeneratedVariants={setGeneratedVariants}
							handleAddOption={handleAddOption}
							handleRemoveOption={handleRemoveOption}
							handleMoveOption={handleMoveOption}
							handleAddOptionValue={handleAddOptionValue}
							handleRemoveOptionValue={handleRemoveOptionValue}
							handleMoveOptionValue={handleMoveOptionValue}
							handleUpdateOptionName={handleUpdateOptionName}
							handleUpdateVariantField={handleUpdateVariantField}
							handleRemoveVariant={handleRemoveVariant}
							simplePrice={simplePrice}
							setSimplePrice={setSimplePrice}
							simpleDiscountPrice={simpleDiscountPrice}
							setSimpleDiscountPrice={setSimpleDiscountPrice}
							simpleStock={simpleStock}
							setSimpleStock={setSimpleStock}
						/>
					</div>
				)}
			</div>

			{/* Floating Controls */}
			<div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white border border-brand-border p-3 rounded-xl shadow-lg shadow-gray-200/50">
				<button
					type="button"
					onClick={handleCancel}
					className="h-9 px-4 border border-brand-border text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark font-semibold rounded-lg text-xs transition-colors cursor-pointer"
				>
					Hủy bỏ
				</button>
				<button
					type="button"
					onClick={handleSave}
					disabled={!isCurrentTabDirty || isSaving}
					className={`h-9 px-5 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${
						!isCurrentTabDirty || isSaving
							? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none"
							: "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark cursor-pointer"
					}`}
				>
					{isSaving ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : (
						<Save className="w-3.5 h-3.5" />
					)}
					Lưu thông tin
				</button>
			</div>

			{/* Modal Cảnh Báo Thay Đổi Mô Hình Biến Thể */}
			<VariantSwitchWarningModal
				isOpen={isSwitchWarningOpen}
				targetIsMultiple={enableVariants}
				onConfirm={handleConfirmVariantSwitch}
				onCancel={() => setIsSwitchWarningOpen(false)}
			/>

			{/* Modal Xác Nhận Hủy Thay Đổi (Nếu có dirty ở bất kỳ tab nào) */}
			<DiscardChangesModal
				isOpen={isDiscardModalOpen}
				onConfirm={() => {
					setIsDiscardModalOpen(false);
					navigate(
						`/seller/${shopId || "default"}/dashboard/products/list`,
					);
				}}
				onCancel={() => setIsDiscardModalOpen(false)}
			/>

			{/* Modal Xác Nhận Xóa Variant / Option / OptionValue */}
			<DeleteEntityModal
				isOpen={Boolean(deleteModal?.isOpen)}
				title={
					deleteModal?.type === "variant"
						? "Xác nhận xóa biến thể"
						: deleteModal?.type === "option"
						? "Xác nhận xóa nhóm phân loại"
						: "Xác nhận xóa giá trị phân loại"
				}
				entityName={deleteModal?.name || ""}
				entityId={deleteModal?.id}
				warningNote={
					deleteModal?.type === "variant"
						? "Hệ thống sẽ kiểm tra đơn hàng đang xử lý qua gRPC sang Order Service. Nếu chưa từng phát sinh đơn hàng, biến thể sẽ được xóa vĩnh viễn (Hard Delete); nếu chỉ có đơn hàng lịch sử, biến thể sẽ được lưu vết (Soft Delete)."
						: deleteModal?.type === "option"
						? "Chỉ có thể xóa nhóm phân loại này khi không còn bất kỳ biến thể nào đang sử dụng các giá trị của nhóm."
						: "Chỉ có thể xóa giá trị phân loại này khi không còn bất kỳ biến thể nào đang liên kết với giá trị này."
				}
				isLoading={
					deleteVariantMutation.isPending ||
					deleteOptionMutation.isPending ||
					deleteOptionValueMutation.isPending
				}
				onConfirm={handleConfirmDeleteModal}
				onCancel={() => setDeleteModal(null)}
			/>
		</div>
	);
}
