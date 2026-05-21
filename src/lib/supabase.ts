import { Category, Product, Order, OrderItem, SiteSettings, AnalyticsLog } from '../types';

export const hasRealSupabase = () => false;
export const supabase = null;
export const SQL_SCHEMA_BLUEPRINT = '';

// Helper to make API calls to the Express backend
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const url = `/api${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
};

export const dataService = {
  updateConfig: (url: string, key: string) => {},
  resetToLocal: () => {},
  isRealMode: () => true, // Indicate that DB is active via Express

  // AUTH
  login: async (email: string, password: string) => {
    return await apiCall('/auth/login', 'POST', { email, password });
  },

  register: async (email: string, password: string) => {
    return await apiCall('/auth/register', 'POST', { email, password });
  },

  fetchUsers: async () => {
    try {
      return await apiCall('/users');
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await apiCall(`/users/${id}`, 'DELETE');
    return true;
  },

  // CATEGORIES
  fetchCategories: async (): Promise<Category[]> => {
    try {
      return await apiCall('/categories');
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  upsertCategory: async (category: Category): Promise<Category> => {
    return await apiCall('/categories', 'POST', category);
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    await apiCall(`/categories/${id}`, 'DELETE');
    return true;
  },

  // PRODUCTS
  fetchProducts: async (): Promise<Product[]> => {
    try {
      return await apiCall('/products');
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  upsertProduct: async (product: Product): Promise<Product> => {
    return await apiCall('/products', 'POST', product);
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    await apiCall(`/products/${id}`, 'DELETE');
    return true;
  },

  // SITE SETTINGS
  fetchSettings: async (): Promise<SiteSettings> => {
    try {
      return await apiCall('/settings');
    } catch (e) {
      console.error(e);
      return {} as SiteSettings;
    }
  },

  saveSettings: async (settings: SiteSettings): Promise<SiteSettings> => {
    return await apiCall('/settings', 'POST', settings);
  },

  // ORDERS & ANONYMOUS PLACEMENT
  placeOrder: async (order: Order, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> => {
    const formattedItems = items.map((idx, index) => ({
      id: `item-${Date.now()}-${index}`,
      order_id: order.id,
      product_id: idx.product_id,
      quantity: idx.quantity,
      price_usd_at_purchase: idx.price_usd_at_purchase
    }));
    
    const res = await apiCall('/orders', 'POST', { order, items: formattedItems });
    return { ...order, items: formattedItems };
  },

  fetchOrders: async (email?: string): Promise<Order[]> => {
    try {
      const qs = email ? `?email=${encodeURIComponent(email)}` : '';
      return await apiCall(`/orders${qs}`);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  updateOrderStatus: async (id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<boolean> => {
    await apiCall(`/orders/${id}/status`, 'PUT', { status });
    return true;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    await apiCall(`/orders/${id}`, 'DELETE');
    return true;
  },

  fetchNextOrderNumber: async (): Promise<string> => {
    try {
      const res = await apiCall('/orders/next-number');
      return res.next_number.toString();
    } catch {
      return '1';
    }
  },

  // ANALYTICS & LOGGING
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
      ip_address: '185.112.148.' + Math.floor(Math.random() * 254 + 1), // Simulated
      country: 'Syria', 
      city: Math.random() > 0.4 ? 'Damascus' : 'Aleppo',
      device_type: deviceType,
      os_name: osName,
      visited_page: visitedPage,
      created_at: new Date().toISOString()
    };

    try {
      await apiCall('/analytics', 'POST', log);
    } catch(e) {
      console.error('Analytics log failed', e);
    }
  },

  fetchAnalytics: async (): Promise<AnalyticsLog[]> => {
    try {
      return await apiCall('/analytics');
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
