export type PromoType = 'Lightning Deal' | 'Best Deal' | 'Promo Code' | 'Prime Exclusive' | 'Sale';

export interface Promotion {
  id: string;
  productName: string;
  amazonLink: string;
  promoCode: string | null;
  discountPercent: number;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string; // ISO string YYYY-MM-DD
  promoType: PromoType;
  imageUrl: string;
  isActive: boolean;
}
