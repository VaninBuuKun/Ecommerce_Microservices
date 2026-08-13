export const formatStock = (stock: number): string => {
	if (stock >= 1000) {
		return `${(stock / 1000).toFixed(0)}k`;
	}
	return stock.toLocaleString("vi-VN");
};

export const formatPrice = (price: number): string => {
	return `₫${price.toLocaleString("vi-VN")}`;
};
