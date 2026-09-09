export const formatStock = (stock: number): string => {
	return (stock ?? 0).toLocaleString("vi-VN");
};

export const formatPrice = (price: number): string => {
	return `₫${price.toLocaleString("vi-VN")}`;
};
