import type { Product } from "../types";

/**
 * FEATURE FLAG: USE_MOCK_DATA
 * Đặt true khi muốn xem thử giao diện với dữ liệu mẫu trước khi nối DB thực tế.
 * Dễ dàng xóa toàn bộ file này sau này mà không ảnh hưởng tới code gốc.
 */
export const USE_MOCK_DATA = false;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 101,
    name: "Áo Thun Cotton Unisex Premium 100%",
    description: "<h3>Đặc điểm nổi bật:</h3><ul><li><strong>Chất liệu:</strong> 100% Cotton nhập khẩu mềm mịn, co giãn 4 chiều.</li><li><strong>Công nghệ in:</strong> In kỹ thuật số sắc nét, không bong tróc khi giặt máy.</li><li><strong>Kiểu dáng:</strong> Form rộng Unisex trẻ trung, năng động.</li></ul><p>Phù hợp mặc đi chơi, dạo phố, đi học vô cùng thoải mái.</p>",
    averageRating: 4.8,
    reviewCount: 142,
    ratingSum: 681,
    price: 250000,
    priceDisplay: 199000,
    discountPrice: 199000,
    availableStock: 500,
    sold: 1250,
    attributesJson: JSON.stringify([
      { key: "Xuất xứ", value: "Việt Nam" },
      { key: "Chất liệu", value: "100% Cotton Premium" },
      { key: "Kiểu dáng", value: "Unisex Oversize" },
      { key: "Thương hiệu", value: "Local Brand Premium" },
      { key: "Bảo hành", value: "1 đổi 1 trong 30 ngày" },
    ]),
    status: "Active",
    thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
    videoUrl: null,
    imageUrls: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop",
    ],
    weight: 250,
    length: 30,
    width: 20,
    height: 3,
    categoryId: 1,
    categoryName: "Thời trang Nam",
    parentCategoryName: "Thời trang",
    shopId: 1,
    shopName: "Fashion Official Store",
    shopPhone: "0901234567",
    shopAddress: "Quận 1, TP. Hồ Chí Minh",
    shopRecipient: "Chủ Shop Fashion",
    shopOwnerId: 10,
    options: [],
    variants: [],
  },
];
