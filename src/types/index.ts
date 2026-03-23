export type PromoType = 'Lightning Deal' | 'Best Deal' | 'Promo Code' | 'Prime Exclusive' | 'Sale';

export interface Promotion {
  id: string;
  productName: string;
  amazonLink: string;
  promoCode: string | null;
  discountPercent: number;
  startDate: string; // ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  endDate: string; // ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  promoType: PromoType;
  imageUrl: string;
  isActive: boolean;
}
