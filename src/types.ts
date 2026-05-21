export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image_type: 'local' | 'url';
  image_path: string;
  video_type: 'local' | 'url' | 'none';
  video_path?: string;
  cost_usd: number;
  margin_usd: number;
  secret_info?: string;
  is_active: boolean;
  has_warranty?: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone: string;
  user_email?: string;
  total_usd: number;
  total_syp: number;
  exchange_rate_at_purchase: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_usd_at_purchase: number;
  product?: Product;
}

export interface SiteSettings {
  id: string;
  usd_to_syp_rate: number;
  is_syriatel_cash_active: boolean;
  is_mtn_cash_active: boolean;
  is_sham_cash_active: boolean;
  is_usdt_active: boolean;
  announcement_ar?: string;
  announcement_en?: string;
}

export interface AnalyticsLog {
  id: string;
  ip_address?: string;
  country?: string;
  city?: string;
  device_type: string;
  os_name: string;
  visited_page: string;
  created_at?: string;
}

export type Language = 'ar' | 'en';
export type Currency = 'USD' | 'SYP';

export interface CartItem {
  product: Product;
  quantity: number;
}
