import { createClient } from '@supabase/supabase-js';
import { Category, Product, Order, OrderItem, SiteSettings, AnalyticsLog } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const hasRealSupabase = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const SQL_SCHEMA_BLUEPRINT = '';

export const dataService = {
  updateConfig: (_url: string, _key: string) => {},
  resetToLocal: () => {},
  isRealMode: () => true,

  // ─── AUTH ───────────────────────────────────────────────────────────────

  login: async (email: string, password: string) => {
    // أول: نشوف هل الإيميل موجود
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!userExists) {
      return { success: false, error: 'email_not_found' };
    }

    // ثاني: نتحقق من الباسورد
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (!user) {
      return { success: false, error: 'incorrect_password' };
    }

    return { success: true, user };
  },

  register: async (email: string, password: string) => {
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (selectError) {
      console.error('[Supabase] register select error:', selectError);
      return { success: false, error: selectError.message || 'Database error' };
    }

    if (existing) {
      return { success: false, error: 'email_already_exists' };
    }

    const { error } = await supabase.from('users').insert({
      id: `user-${Date.now()}`,
      email,
      password,
      role: 'user',
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Supabase] register insert error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
    return { success: true, email };
  },

  fetchUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password, role, created_at')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ─── CATEGORIES ─────────────────────────────────────────────────────────

  fetchCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) { console.error(error); return []; }
    return data || [];
  },

  upsertCategory: async (category: Category): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .upsert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ─── PRODUCTS ───────────────────────────────────────────────────────────

  fetchProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  },

  upsertProduct: async (product: Product): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .upsert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ─── SITE SETTINGS ──────────────────────────────────────────────────────

  fetchSettings: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'settings-row')
      .maybeSingle();
    if (error || !data) { console.error(error); return {} as SiteSettings; }
    return data;
  },

  saveSettings: async (settings: SiteSettings): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(settings)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── ORDERS ─────────────────────────────────────────────────────────────

  placeOrder: async (
    order: Order,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Promise<Order> => {
    const formattedItems = items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_usd_at_purchase: item.price_usd_at_purchase,
    }));

    const { error: orderError } = await supabase.from('orders').insert(order);
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from('order_items').insert(formattedItems);
    if (itemsError) throw itemsError;

    return { ...order, items: formattedItems };
  },

  fetchOrders: async (email?: string): Promise<Order[]> => {
    let query = supabase
      .from('orders')
      .select(`*, items:order_items(*, product:products(*))`)
      .order('created_at', { ascending: false });

    if (email && email !== 'admin@paynode.com') {
      query = query.eq('user_email', email);
    }

    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data || [];
  },

  updateOrderStatus: async (
    id: string,
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  fetchNextOrderNumber: async (): Promise<string> => {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return '1';
    const maxNum = Math.max(...data.map((o: any) => parseInt(o.order_number) || 0));
    return (maxNum + 1).toString();
  },

  // ─── ANALYTICS ──────────────────────────────────────────────────────────

  logAnalytics: async (visitedPage: string): Promise<void> => {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    if (/Mobi|Android|iPhone|iPad/i.test(userAgent)) deviceType = 'Mobile';
    else if (/Tablet/i.test(userAgent)) deviceType = 'Tablet';

    let osName = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) osName = 'Windows';
    else if (userAgent.indexOf('Mac') !== -1) osName = 'MacOS';
    else if (userAgent.indexOf('Android') !== -1) osName = 'Android';
    else if (userAgent.indexOf('like Mac') !== -1) osName = 'iOS';

    const log: AnalyticsLog = {
      id: `an-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ip_address: '',
      country: 'Syria',
      city: Math.random() > 0.4 ? 'Damascus' : 'Aleppo',
      device_type: deviceType,
      os_name: osName,
      visited_page: visitedPage,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('analytics_logs').insert(log);
    if (error) console.error('Analytics log failed', error);
  },

  fetchAnalytics: async (): Promise<AnalyticsLog[]> => {
    const { data, error } = await supabase
      .from('analytics_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  },
};
