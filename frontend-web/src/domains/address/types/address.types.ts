export interface UserAddressDto {
  id: string;
  recipientName: string;
  phone: string;
  provinceId: number;
  districtId: number;
  wardId?: number;
  wardCode?: string;
  addressLine?: string;
  fullAddress?: string;
  isDefault: boolean;
}
