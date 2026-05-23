import React, { useState, useEffect } from 'react';
import { Category, Product, Order, SiteSettings, AnalyticsLog, Language } from '../types';
import { translations } from '../lib/translations';
import { dataService, SQL_SCHEMA_BLUEPRINT } from '../lib/supabase';
import { 
  Settings, Layers, Package, ShoppingBag, BarChart3, Lock, Eye, EyeOff,
  Plus, Edit, Trash2, Check, RefreshCw, Smartphone, Monitor, Globe, Copy, CheckSquare, Sparkles, Key, ExternalLink, HelpCircle, PhoneCall, User
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onRefreshData: () => void;
  categories: Category[];
  products: Product[];
  settings: SiteSettings;
  isRealSupabaseActive: boolean;
  isAdminLoggedIn: boolean;
  onLoginStateChange: (loggedIn: boolean) => void;
}

export default function AdminDashboard({
  isOpen,
  onClose,
  lang,
  onRefreshData,
  categories: initialCategories,
  products: initialProducts,
  settings: initialSettings,
  isRealSupabaseActive,
  isAdminLoggedIn,
  onLoginStateChange
}: AdminDashboardProps) {
  const t = translations[lang];

  // Tab State
  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'products' | 'orders' | 'analytics' | 'supabase' | 'users' | 'my_orders'>('settings');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // Track currently logged-in user details
  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    return localStorage.getItem('paynode_user_email') || '';
  });

  // Calculate generic login and specific admin roles
  const isLoggedIn = isAdminLoggedIn; // Using provided prop as generic auth boolean state
  const isAdminSession = loggedInEmail === 'admin@paynode.com';

  // Loaded DB info
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsLog[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Editing States
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState<Omit<Product, 'id'>>({
    category_id: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    image_type: 'url',
    image_path: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    video_type: 'none',
    video_path: '',
    cost_usd: 0,
    margin_usd: 0,
    secret_info: '',
    is_active: true,
    has_warranty: true,
    is_best_seller: false,
    is_new_release: false
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<Omit<Category, 'id'>>({
    name_ar: '',
    name_en: '',
    slug: ''
  });

  // Supabase Link forms
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem('paynode_supabase_url') || '');
  const [supaKey, setSupaKey] = useState(localStorage.getItem('paynode_supabase_anon_key') || '');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Status alerts
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen, initialCategories, initialProducts, initialSettings]);

  const loadAdminData = async () => {
    try {
      setCategories(initialCategories);
      setProducts(initialProducts);
      setSettings(initialSettings);
      
      const currentEmail = localStorage.getItem('paynode_user_email') || '';
      const ords = await dataService.fetchOrders(currentEmail);
      setOrders(ords);

      const logs = await dataService.fetchAnalytics();
      setAnalytics(logs);

      if (currentEmail === 'admin@paynode.com') {
        const users = await dataService.fetchUsers();
        setUsersList(users);
      }
    } catch (err) {
      console.error('Failure reloading admin data:', err);
    }
  };

  if (!isOpen) return null;

  // Authorization & generic auth helper
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    const getFriendlyError = (errKey: string) => {
      const isAr = lang === 'ar';
      if (errKey === 'email_not_found') {
        return isAr 
          ? 'البريد الإلكتروني هذا غير مسجل لدينا، يرجى إنشاء حساب جديد بالضغط بالأسفل.' 
          : 'This email is not registered. Please sign up for a new account.';
      }
      if (errKey === 'incorrect_password') {
        return isAr 
          ? 'كلمة المرور خاطئة تماماً! يرجى التأكد وإعادة المحاولة.' 
          : 'Incorrect password! Please check and try again.';
      }
      if (errKey === 'email_already_exists') {
        return isAr 
          ? 'هذا البريد الإلكتروني مسجل لدينا بالفعل! يرجى تسجيل الدخول بدلاً من ذلك.' 
          : 'This email is already registered! Please sign in instead.';
      }
      if (errKey === 'Invalid credentials') {
        return isAr 
          ? 'بيانات الاعتماد خاطئة أو الحساب غير متوفر.' 
          : 'Invalid credentials. Please verify and try again.';
      }
      if (errKey.includes('API Error:')) {
        return isAr
          ? 'تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك والمحاولة مجدداً.'
          : 'Could not establish connection to the database. Please check your network and try again.';
      }
      return errKey;
    };

    try {
      if (isSignup) {
        const res = await dataService.register(email, password);
        if (res.success) {
          setIsSignup(false);
          // Auto login after successful registration
          localStorage.setItem('paynode_admin_logged_in', 'true');
          localStorage.setItem('paynode_user_email', email);
          setLoggedInEmail(email);
          setActiveTab('my_orders');
          onLoginStateChange(true);
          loadAdminData();
          if (email !== 'admin@paynode.com') {
             onClose();
          }
        } else {
          setLoginError(getFriendlyError(res.error || 'Registration failed'));
        }
      } else {
        const res = await dataService.login(email, password);
        if (res.success && res.user) {
          localStorage.setItem('paynode_admin_logged_in', 'true');
          localStorage.setItem('paynode_user_email', res.user.email);
          setLoggedInEmail(res.user.email);
          if (res.user.email !== 'admin@paynode.com') {
            setActiveTab('my_orders');
            onClose(); // Close the modal to redirect to home page
          }
          onLoginStateChange(true);
          setLoginError('');
          loadAdminData();
        } else {
          setLoginError(getFriendlyError(res.error || t.login_error));
        }
      }
    } catch (err: any) {
      setLoginError(getFriendlyError(err.message || t.login_error));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await dataService.saveSettings(settings);
      setSettings(updated);
      setSuccessMsg(t.settings_save_success);
      setTimeout(() => setSuccessMsg(''), 3000);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // CATEGORY OPERATIONS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = selectedCategoryId || `cat-${Date.now()}`;
      const newCat: Category = { ...catForm, id };
      await dataService.upsertCategory(newCat);
      
      setSelectedCategoryId(null);
      setCatForm({ name_ar: '', name_en: '', slug: '' });
      setSuccessMsg(lang === 'ar' ? 'تم حفظ القسم!' : 'Category saved!');
      setTimeout(() => setSuccessMsg(''), 2000);
      onRefreshData();
      
      // reload
      const loadedCats = await dataService.fetchCategories();
      setCategories(loadedCats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await dataService.deleteCategory(id);
      onRefreshData();
      const loadedCats = await dataService.fetchCategories();
      setCategories(loadedCats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setSelectedCategoryId(cat.id);
    setCatForm({
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      slug: cat.slug
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm(prev => ({ ...prev, image_path: reader.result as string, image_type: 'url' }));
      };
      reader.readAsDataURL(file);
      // Reset so same file can be selected again
      e.target.value = '';
    }
  };

  // PRODUCT OPERATIONS
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = selectedProductId || `prod-${Date.now()}`;
      const newProd: Product = { ...prodForm, id };
      await dataService.upsertProduct(newProd);

      setSelectedProductId(null);
      // Reset form
      setProdForm({
        category_id: categories[0]?.id || '',
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        image_type: 'url',
        image_path: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        video_type: 'none',
        video_path: '',
        cost_usd: 0,
        margin_usd: 0,
        secret_info: '',
        is_active: true,
        has_warranty: true,
        is_best_seller: false,
        is_new_release: false
      });

      setSuccessMsg(lang === 'ar' ? 'تم حفظ وضبط المنتج بالنجاح!' : 'Product saved successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
      onRefreshData();

      const loadedProds = await dataService.fetchProducts();
      setProducts(loadedProds);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await dataService.deleteProduct(id);
      onRefreshData();
      const loadedProds = await dataService.fetchProducts();
      setProducts(loadedProds);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProdForm({
      category_id: prod.category_id,
      title_ar: prod.title_ar,
      title_en: prod.title_en,
      description_ar: prod.description_ar,
      description_en: prod.description_en,
      image_type: prod.image_type,
      image_path: prod.image_path,
      video_type: prod.video_type,
      video_path: prod.video_path || '',
      cost_usd: prod.cost_usd,
      margin_usd: prod.margin_usd,
      secret_info: prod.secret_info || '',
      is_active: prod.is_active,
      has_warranty: prod.has_warranty ?? true,
      is_best_seller: prod.is_best_seller ?? false,
      is_new_release: prod.is_new_release ?? false
    });
  };

  // ORDER OPERATIONS
  const handleUpdateOrderStatus = async (ordId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await dataService.updateOrderStatus(ordId, status);
      const currentEmail = localStorage.getItem('paynode_user_email') || '';
      const updatedOrders = await dataService.fetchOrders(currentEmail);
      setOrders(updatedOrders);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (ordId: string) => {
    try {
      await dataService.deleteOrder(ordId);
      const currentEmail = localStorage.getItem('paynode_user_email') || '';
      const updatedOrders = await dataService.fetchOrders(currentEmail);
      setOrders(updatedOrders);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await dataService.deleteUser(userId);
      const users = await dataService.fetchUsers();
      setUsersList(users);
    } catch (err) {
      console.error(err);
    }
  };

  // Bootstrapping Supabase DB Connections
  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (supaUrl.trim() && supaKey.trim()) {
      dataService.updateConfig(supaUrl.trim(), supaKey.trim());
    } else {
      alert(lang === 'ar' ? 'الرجاء إدخال رابط المشروع والمفتاح البرمجي معاً' : 'Please provide both the project URL and Secret Anon Key.');
    }
  };

  const handleDisconnectSupabase = () => {
    dataService.resetToLocal();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_BLUEPRINT);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Computations for Analytics Logs
  const totalLogs = analytics.length;
  const mobileCount = analytics.filter(l => l.device_type === 'Mobile').length;
  const desktopCount = analytics.filter(l => l.device_type === 'Desktop').length;
  const tabletCount = analytics.filter(l => l.device_type === 'Tablet').length;

  const osMap = analytics.reduce((acc, current) => {
    acc[current.os_name] = (acc[current.os_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pageMap = analytics.reduce((acc, current) => {
    acc[current.visited_page] = (acc[current.visited_page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in flex items-center justify-center">
      <div 
        className="w-full max-w-none bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row h-full overflow-hidden shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        
        {/* Left/Right Sidebar panel depending on chosen lang */}
        <aside className="w-full md:w-64 bg-slate-950 border-r md:border-r-0 md:border-l border-slate-850 p-4 flex flex-col justify-between shrink-0">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-350 tracking-widest">{isAdminSession ? 'PAYNODE OS' : (lang === 'ar' ? 'حساب المستخدم' : 'USER ACCOUNT')}</span>
                <span className="text-[9px] font-mono text-[#00E5FF] tracking-tight">{isAdminSession ? 'OPERATING CORE V1.4' : 'DASHBOARD V1.0'}</span>
              </div>
              <button
                onClick={onClose}
                className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

            {isLoggedIn && (
              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
                
                {isAdminSession ? (
                  <>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'settings' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20 shadow-[0_0_8px_rgba(0,229,255,0.1)]' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Settings size={14} />
                      <span>{t.admin_tab_settings}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'categories' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers size={14} />
                      <span>{t.admin_tab_categories}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('products')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'products' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Package size={14} />
                      <span>{t.admin_tab_products}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap flex justify-between ${
                        activeTab === 'orders' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex flex-row items-center gap-2.5">
                        <ShoppingBag size={14} />
                        <span>{t.admin_tab_orders}</span>
                      </div>
                      {orders.filter(o => o.status === 'pending').length > 0 && (
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black">{orders.filter(o => o.status === 'pending').length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'analytics' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 size={14} />
                      <span>{t.admin_tab_analytics}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'users' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <User size={14} />
                      <span>{lang === 'ar' ? 'المستخدمين' : 'Users'}</span>
                    </button>

                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('my_orders')}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'my_orders' 
                          ? 'bg-[#0A2540] text-[#00E5FF] border border-cyan-500/20 shadow-[0_0_8px_rgba(0,229,255,0.1)]' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{lang === 'ar' ? 'سجل طلباتي' : 'My Orders'}</span>
                    </button>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="hidden md:block">
            {isLoggedIn && (
              <span className="text-[10px] text-slate-600 block truncate" title={loggedInEmail}>{loggedInEmail}</span>
            )}
            <span className="text-[10px] text-cyan-500/40 font-mono tracking-tighter">SECURED ENCRYPTED SYNC</span>
          </div>

        </aside>

        {/* Primary Tab Content Panel */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto bg-slate-900/45 flex flex-col justify-between">

          {successMsg && (
            <div className="mb-4 bg-emerald-950/40 text-[#32CD32] border border-[#32CD32]/20 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {!isLoggedIn ? (
            /* LOCK SCREEN FORM GATEWAY */
            <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto py-12 px-4 w-full">
              <div className="text-center mb-8">
                  <div className="mx-auto w-14 h-14 bg-slate-900 shadow-xl text-white rounded-2xl border border-slate-800 flex items-center justify-center mb-4">
                    <User size={24} />
                  </div>
                  <h3 className="text-white font-black text-xl tracking-wide mb-1">
                    {lang === 'ar' 
                      ? (isSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول لحسابك')
                      : (isSignup ? 'Create Account' : 'Welcome Back')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' ? 'سجل دخولك لمتابعة طلباتك بأمان' : 'Sign in to track your orders securely'}
                  </p>
              </div>

              <form onSubmit={handleAuth} className="w-full space-y-5 bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400">
                    <HelpCircle size={14} className="shrink-0" />
                    <p className="text-[11px] font-bold">{loginError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 px-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/50 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 font-medium transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 px-1">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/50 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 font-medium transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
                >
                  <Lock size={16} />
                  {isAuthenticating ? (lang === 'ar' ? 'جاري الدخول...' : 'Signing in...') : (isSignup ? (lang === 'ar' ? 'إنشاء حساب' : 'Sign Up') : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'))}
                </button>
              </form>

              <div className="mt-8 text-center select-none">
                <span className="text-slate-500 text-xs">
                  {isSignup ? (lang === 'ar' ? 'لديك حساب سلفاً؟' : 'Already have an account?') : (lang === 'ar' ? 'ليس لديك حساب؟' : 'Don\'t have an account?')}
                </span>
                {' '}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(!isSignup);
                    setLoginError('');
                  }}
                  className="text-white hover:text-cyan-400 cursor-pointer font-bold text-xs transition-colors"
                >
                  {isSignup 
                    ? (lang === 'ar' ? 'تسجيل الدخول' : 'Sign in here')
                    : (lang === 'ar' ? 'إنشاء حساب مستخدم' : 'Create an account')}
                </button>
              </div>
            </div>
          ) : (
            /* TABBED VIEWS ONCE LOGGED IN SUCCESS */
            <div className="flex-grow flex flex-col h-full">

              {activeTab === 'my_orders' && !isAdminSession && (
                <div className="space-y-4 animate-fade-in text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                       <ShoppingBag size={18} className="text-[#00E5FF]" />
                       {lang === 'ar' ? 'سجل طلباتي' : 'My Purchase History'}
                    </h2>
                  </div>
                  
                  {orders.filter(o => o.user_email === loggedInEmail).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-medium text-xs border border-slate-800 rounded bg-slate-900/50">
                      {lang === 'ar' ? 'لا توجد طلبات سابقة حتى الآن.' : 'No orders found yet.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.filter(o => o.user_email === loggedInEmail).map(ord => (
                        <div key={ord.id} className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-white mb-1 uppercase tracking-widest">{t.order_id}: #{ord.order_number}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(ord.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              ord.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ord.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {ord.status}
                            </span>
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              title={lang === 'ar' ? 'حذف الطلب' : 'Delete Order'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-white">{ord.total_usd.toFixed(2)} USD</p>
                            <p className="text-[10px] text-slate-500">{ord.total_syp.toLocaleString()} {lang === 'ar' ? 'ل.س' : 'SYP'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* TAB 1: Global Site Settings */}
              {activeTab === 'settings' && isAdminSession && (
                <form onSubmit={handleUpdateSettings} className="space-y-6 flex-grow flex flex-col justify-between">
                  
                  <div className="space-y-5">
                    <div className="border-b border-slate-850 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.admin_tab_settings}</h3>
                      <p className="text-[10px] text-slate-400">Configure margins, conversion ratios, and alerts.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Rate */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-350">{t.settings_exchange_rate}</label>
                        <input
                          type="number"
                          required
                          value={settings.usd_to_syp_rate}
                          onChange={(e) => setSettings({ ...settings, usd_to_syp_rate: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white font-mono rounded-lg p-2.5"
                        />
                      </div>
                    </div>

                    {/* Active payment gateways checks */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-350">{t.settings_active_gateways}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Syriatel */}
                        <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={settings.is_syriatel_cash_active}
                            onChange={(e) => setSettings({ ...settings, is_syriatel_cash_active: e.target.checked })}
                            className="accent-cyan-400"
                          />
                          <span>Syriatel Cash</span>
                        </label>
                        {/* MTN */}
                        <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={settings.is_mtn_cash_active}
                            onChange={(e) => setSettings({ ...settings, is_mtn_cash_active: e.target.checked })}
                            className="accent-cyan-400"
                          />
                          <span>MTN Cash</span>
                        </label>
                        {/* Sham */}
                        <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={settings.is_sham_cash_active}
                            onChange={(e) => setSettings({ ...settings, is_sham_cash_active: e.checked ? true : e.target.checked })}
                            className="accent-cyan-400"
                          />
                          <span>Sham Cash</span>
                        </label>
                        {/* USDT */}
                        <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={settings.is_usdt_active}
                            onChange={(e) => setSettings({ ...settings, is_usdt_active: e.target.checked })}
                            className="accent-cyan-400"
                          />
                          <span>USDT TRC20</span>
                        </label>
                      </div>
                    </div>

                    {/* Announcements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Ar announcement */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-350">{t.settings_announcement_ar}</label>
                        <textarea
                          value={settings.announcement_ar || ''}
                          rows={3}
                          onChange={(e) => setSettings({ ...settings, announcement_ar: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2.5 leading-relaxed"
                          placeholder="مثال: خصم ٥٠٪ على الرمز الترويجي لويندوز..."
                        />
                      </div>
                      {/* En announcement */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-350">{t.settings_announcement_en}</label>
                        <textarea
                          value={settings.announcement_en || ''}
                          rows={3}
                          onChange={(e) => setSettings({ ...settings, announcement_en: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-lg p-2.5 leading-relaxed"
                          placeholder="e.g. up to 50% discount this month..."
                        />
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-850 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 text-xs font-black px-6 py-2.5 rounded-lg tracking-wide uppercase shadow-md cursor-pointer"
                    >
                      {t.save_changes}
                    </button>
                  </div>

                </form>
              )}

              {/* TAB 2: Categories management */}
              {activeTab === 'categories' && isAdminSession && (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  
                  <div className="space-y-4">
                    <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.admin_tab_categories}</h3>
                        <p className="text-[10px] text-slate-400">Manage structure parameters for product grouping.</p>
                      </div>
                    </div>

                    {/* Add/Edit form */}
                    <form onSubmit={handleSaveCategory} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                      <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#00E5FF] block">
                        {selectedCategoryId ? (lang === 'ar' ? 'تحديث قسم' : 'Modify Category') : t.cat_add_new}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Name AR */}
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={t.cat_name_ar}
                            value={catForm.name_ar}
                            onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded p-2"
                          />
                        </div>
                        {/* Name EN */}
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={t.cat_name_en}
                            value={catForm.name_en}
                            onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded p-2"
                          />
                        </div>
                        {/* Slug */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder={t.cat_slug}
                            value={catForm.slug}
                            onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-white font-mono rounded p-2"
                          />
                          <button
                            type="submit"
                            className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs px-4 rounded transition-all cursor-pointer shrink-0"
                          >
                            {selectedCategoryId ? t.save : t.add}
                          </button>
                        </div>
                      </div>
                      {selectedCategoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(null);
                            setCatForm({ name_ar: '', name_en: '', slug: '' });
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer block mt-1"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </form>

                    {/* Categories Listing table */}
                    <div className="border border-slate-800/80 rounded-xl overflow-auto max-h-[30vh]">
                      <table className="w-full text-left text-xs text-slate-300 min-w-[500px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wide border-b border-slate-800">
                          <tr>
                            <th className="p-3 text-right">{lang === 'ar' ? 'اسم القسم (عربي / English)' : 'Category Name'}</th>
                            <th className="p-3 text-right">Slug</th>
                            <th className="p-3 text-center">{t.action}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-slate-950/40">
                              <td className="p-3">
                                <span className="font-bold text-white block">{cat.name_ar}</span>
                                <span className="text-[10px] text-slate-500 block">{cat.name_en}</span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-cyan-500">{cat.slug}</td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditCategory(cat)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-amber-500 hover:text-amber-400 cursor-pointer"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-red-500 hover:text-red-400 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 3: Products management */}
              {activeTab === 'products' && isAdminSession && (
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                  
                  <div className="space-y-4">
                    <div className="border-b border-slate-850 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.admin_tab_products}</h3>
                      <p className="text-[10px] text-slate-400">Instantly deploy keys, configure margin allocations, and reveal credentials.</p>
                    </div>

                    {/* Add/Edit Product Form panel */}
                    <form onSubmit={handleSaveProduct} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                      <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#00E5FF] block">
                        {selectedProductId ? (lang === 'ar' ? 'تحديث وتعديل المنتج:' : 'Edit Product Details:') : t.prod_add_new}
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title AR */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block pb-0.5">{t.prod_title_ar}</label>
                          <input
                            type="text"
                            required
                            value={prodForm.title_ar}
                            onChange={(e) => setProdForm({ ...prodForm, title_ar: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded"
                            placeholder="مثال: يوتيوب بريميوم سنة كاملة..."
                          />
                        </div>
                        {/* Title EN */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block pb-0.5">{t.prod_title_en}</label>
                          <input
                            type="text"
                            required
                            value={prodForm.title_en}
                            onChange={(e) => setProdForm({ ...prodForm, title_en: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded"
                            placeholder="e.g. YouTube Premium 1 Year..."
                          />
                        </div>
                        {/* Desc AR */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block pb-0.5">{t.prod_desc_ar}</label>
                          <textarea
                            rows={2}
                            required
                            value={prodForm.description_ar}
                            onChange={(e) => setProdForm({ ...prodForm, description_ar: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded"
                          />
                        </div>
                        {/* Desc EN */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block pb-0.5">{t.prod_desc_en}</label>
                          <textarea
                            rows={2}
                            required
                            value={prodForm.description_en}
                            onChange={(e) => setProdForm({ ...prodForm, description_en: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded"
                          />
                        </div>
                      </div>

                      {/* Pricing row & Category selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Category */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block pb-1">Browse grouping</label>
                          <select
                            value={prodForm.category_id}
                            onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                            required
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded outline-none"
                          >
                            <option value="">Choose category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>
                            ))}
                          </select>
                        </div>
                        {/* USD Cost */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block pb-1">{t.prod_cost_usd}</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodForm.cost_usd}
                            onChange={(e) => setProdForm({ ...prodForm, cost_usd: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white font-mono p-2 rounded"
                          />
                        </div>
                        {/* USD Margin */}
                        <div>
                          <label className="text-[10px] font-bold text-[#00E5FF] block pb-1">{t.prod_margin_usd}</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodForm.margin_usd}
                            onChange={(e) => setProdForm({ ...prodForm, margin_usd: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white font-mono p-2 rounded"
                          />
                        </div>
                        {/* Calculated visual Selling price */}
                        <div className="bg-[#0A2540] p-2 rounded border border-cyan-500/20 text-center flex flex-col justify-center select-none">
                          <span className="text-[8px] tracking-widest text-[#00E5FF] font-black block">{t.prod_selling_price}</span>
                          <span className="text-sm font-black text-white">
                            ${(prodForm.cost_usd + prodForm.margin_usd).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ≈ {Math.round((prodForm.cost_usd + prodForm.margin_usd) * settings.usd_to_syp_rate).toLocaleString('ar-SY')} ل.س
                          </span>
                        </div>
                      </div>

                      {/* Image / video pathing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block pb-1">
                            {t.media_url_label}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={prodForm.image_path}
                              onChange={(e) => setProdForm({ ...prodForm, image_path: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded font-mono"
                              placeholder="URL or Upload Base64"
                            />
                            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded text-[10px] whitespace-nowrap flex items-center shrink-0 transition-colors">
                              {lang === 'ar' ? 'رفع صورة' : 'Upload Image'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload} 
                              />
                            </label>
                          </div>
                        </div>

                        {/* Secret supplier box */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                            <span>🛡️ {t.prod_secret_info}</span>
                          </label>
                          <input
                            type="text"
                            value={prodForm.secret_info || ''}
                            onChange={(e) => setProdForm({ ...prodForm, secret_info: e.target.value })}
                            placeholder={t.prod_secret_info_placeholder}
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-white p-2 rounded font-mono placeholder-slate-700"
                          />
                        </div>
                      </div>

                      {/* Active & Warranty toggling */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prodForm.is_active}
                              onChange={(e) => setProdForm({ ...prodForm, is_active: e.target.checked })}
                              className="accent-[#00E5FF] w-4 h-4"
                            />
                            <span className="font-bold text-slate-200">{t.is_active_label}</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prodForm.has_warranty ?? true}
                              onChange={(e) => setProdForm({ ...prodForm, has_warranty: e.target.checked })}
                              className="accent-[#32CD32] w-4 h-4"
                            />
                            <span className="font-bold text-[#32CD32]">{t.has_warranty_label}</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prodForm.is_best_seller ?? false}
                              onChange={(e) => setProdForm({ ...prodForm, is_best_seller: e.target.checked })}
                              className="accent-[#FFD700] w-4 h-4"
                            />
                            <span className="font-bold text-[#FFD700]">{lang === 'ar' ? 'الأكثر مبيعاً 🔥' : 'Best Seller 🔥'}</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prodForm.is_new_release ?? false}
                              onChange={(e) => setProdForm({ ...prodForm, is_new_release: e.target.checked })}
                              className="accent-[#FF5722] w-4 h-4"
                            />
                            <span className="font-bold text-[#FF5722]">{lang === 'ar' ? 'جديدنا 🎉' : 'New Arrival 🎉'}</span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 px-5 py-2 rounded text-xs font-black transition-colors cursor-pointer"
                          >
                            {selectedProductId ? t.save : t.add}
                          </button>
                          {selectedProductId && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(null);
                                setProdForm({
                                  category_id: categories[0]?.id || '',
                                  title_ar: '',
                                  title_en: '',
                                  description_ar: '',
                                  description_en: '',
                                  image_type: 'url',
                                  image_path: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
                                  video_type: 'none',
                                  video_path: '',
                                  cost_usd: 0,
                                  margin_usd: 0,
                                  secret_info: '',
                                  is_active: true,
                                  has_warranty: true,
                                  is_best_seller: false,
                                  is_new_release: false
                                });
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-2 rounded text-xs font-semibold cursor-pointer"
                            >
                              {t.cancel}
                            </button>
                          )}
                        </div>
                      </div>

                    </form>

                    {/* Products listings table */}
                    <div className="border border-slate-800 rounded-xl overflow-auto max-h-[30vh]">
                      <table className="w-full text-left text-xs text-slate-300 min-w-[800px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wide border-b border-slate-800">
                          <tr>
                            <th className="p-3 text-right">{lang === 'ar' ? 'معلومات وعناوين المنتج' : 'Product Information'}</th>
                            <th className="p-3 text-right">Selling Price</th>
                            <th className="p-3 text-right">Cost / Margin</th>
                            <th className="p-3 text-center">{t.status}</th>
                            <th className="p-3 text-center">{t.action}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {products.map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-950/40">
                              <td className="p-3">
                                <span className="font-bold text-white block">{lang === 'ar' ? prod.title_ar : prod.title_en}</span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-sm">{lang === 'ar' ? prod.description_ar : prod.description_en}</span>
                                {prod.secret_info && (
                                  <span className="bg-red-950/20 text-red-400 border border-red-500/10 rounded px-1.5 py-0.5 text-[9px] font-mono mt-1 inline-block">
                                    🔑 {prod.secret_info}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-400 text-xs">
                                ${(prod.cost_usd + prod.margin_usd).toFixed(2)}
                              </td>
                              <td className="p-3 font-mono text-[10px] text-slate-450 text-xs">
                                <span>${prod.cost_usd.toFixed(2)}</span>
                                <span className="text-[#00E5FF] px-1">+</span>
                                <span className="text-[#00E5FF]">${prod.margin_usd.toFixed(2)}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  prod.is_active 
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' 
                                    : 'bg-slate-800 text-slate-500 border border-transparent'
                                }`}>
                                  {prod.is_active ? 'Active' : 'Offline'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleEditProduct(prod)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-amber-500 hover:text-amber-400 cursor-pointer"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-red-500 hover:text-red-400 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: Orders overview */}
              {activeTab === 'orders' && isAdminSession && (
                <div className="space-y-5 flex-grow">
                  
                  <div className="border-b border-slate-850 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.admin_tab_orders}</h3>
                    <p className="text-[10px] text-slate-400">View customer invoice receipts, verify receipts, and launch conversational follow-ups on WhatsApp.</p>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-auto max-h-[50vh]">
                    <table className="w-full text-left text-xs text-slate-300 min-w-[700px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wide border-b border-slate-800">
                        <tr>
                          <th className="p-3 text-right">{t.order_id}</th>
                          <th className="p-3 text-right">{t.customer}</th>
                          <th className="p-3 text-right">{t.total_amount}</th>
                          <th className="p-3 text-right">{lang === 'ar' ? 'بوابة الدفع' : 'Gateway'}</th>
                          <th className="p-3 text-center">{t.status}</th>
                          <th className="p-3 text-center">{t.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {orders.map(ord => {
                          const contactNumber = ord.customer_phone.replace('+', '');
                          const waUrl = `https://wa.me/${contactNumber}`;

                          return (
                            <tr key={ord.id} className="hover:bg-slate-950/40">
                              <td className="p-3 font-mono text-[11px] font-bold text-cyan-400">
                                #{ord.order_number}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-white block">{ord.customer_name || 'Anonymous User'}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">{ord.customer_phone}</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">
                                  {new Date(ord.created_at || '').toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}
                                </span>
                              </td>
                              <td className="p-3 text-xs">
                                <span className="font-black text-white block">
                                  {lang === 'ar' ? `${ord.total_syp.toLocaleString('ar-SY')} ل.س` : `$${ord.total_usd.toFixed(2)}`}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {lang === 'ar' ? `($${ord.total_usd.toFixed(2)})` : `${ord.total_syp.toLocaleString('ar-SY')} ل.س`}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                                  {ord.payment_method}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                  className={`text-[10px] font-bold py-1 px-2.5 rounded border outline-none cursor-pointer ${
                                    ord.status === 'completed' ? 'bg-emerald-950/40 text-[#32CD32] border-emerald-500/20' :
                                    ord.status === 'cancelled' ? 'bg-red-950/30 text-red-400 border-red-500/10' :
                                    'bg-amber-950/30 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  <option value="pending" className="bg-slate-900 text-amber-400">{t.pending}</option>
                                  <option value="completed" className="bg-slate-900 text-[#32CD32]">{t.completed}</option>
                                  <option value="cancelled" className="bg-slate-900 text-red-400">{t.cancelled}</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  {/* Direct WhatsApp chat action link */}
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-emerald-500/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    <PhoneCall size={11} />
                                    <span>Chat</span>
                                  </a>
                                  <button
                                    onClick={() => handleDeleteOrder(ord.id)}
                                    className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/30 px-2 py-1.5 rounded-lg transition-all"
                                    title="Delete Order"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* TAB 5: Analytics metrics */}
              {activeTab === 'analytics' && isAdminSession && (
                <div className="space-y-6 flex-grow">
                  
                  <div className="border-b border-slate-850 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.admin_tab_analytics}</h3>
                    <p className="text-[10px] text-slate-400">Capture low-overhead privacy-compliant visitor telemetry metrics (device type, operating systems).</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 block tracking-widest uppercase">PLATFORM VISITS</span>
                      <span className="text-3xl font-black text-[#00E5FF] font-mono mt-1 block">{totalLogs}</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 block tracking-widest uppercase">DESKTOP VISITS</span>
                      <span className="text-3xl font-black text-white font-mono mt-1 block">{desktopCount}</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 block tracking-widest uppercase">MOBILE VISITS</span>
                      <span className="text-3xl font-black text-white font-mono mt-1 block">{mobileCount}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Operating Systems CSS charts */}
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Monitor size={12} className="text-[#00E5FF]" />
                        <span>{t.analytics_os}</span>
                      </h4>

                      <div className="space-y-2.5 pt-1">
                        {Object.entries(osMap).map(([osName, count]) => {
                          const percentage = totalLogs > 0 ? ((count as number) / totalLogs) * 100 : 0;
                          return (
                            <div key={osName} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-300">{osName}</span>
                                <span className="text-slate-400 font-mono">{percentage.toFixed(0)}% ({count as number})</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-cyan-400 h-full rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visited Page breakdowns */}
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Globe size={12} className="text-[#00E5FF]" />
                        <span>{t.analytics_pages}</span>
                      </h4>

                      <div className="space-y-2.5 pt-1">
                        {Object.entries(pageMap).map(([page, count]) => {
                          const percentage = totalLogs > 0 ? ((count as number) / totalLogs) * 100 : 0;
                          return (
                            <div key={page} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-300 font-mono">{page}</span>
                                <span className="text-slate-400 font-mono">{count as number} {t.analytics_visit}</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-[#32CD32] h-full rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 6: Users */}
              {activeTab === 'users' && isAdminSession && (
                <div className="space-y-6 flex-grow">
                  <div className="border-b border-slate-850 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{lang === 'ar' ? 'المستخدمين' : 'Users'}</h3>
                    <p className="text-[10px] text-slate-400">{lang === 'ar' ? 'عرض جميع المستخدمين المسجلين في الموقع' : 'View all registered users.'}</p>
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-850 overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/50 border-b border-slate-850">
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">ID</th>
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</th>
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</th>
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</th>
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Joined</th>
                            <th className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">{t.action}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                                {lang === 'ar' ? 'لا يوجد مستخدمين مسجلين' : 'No registered users yet.'}
                              </td>
                            </tr>
                          ) : (
                            usersList.map((usr: any) => (
                              <tr key={usr.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3">
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                    {usr.id.slice(0, 8)}...
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-xs font-semibold text-white">
                                    {usr.email}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-xs font-mono text-slate-300">
                                    {usr.password}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 text-[10px] font-bold rounded-full ${usr.role === 'admin' ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-slate-800 text-slate-300'}`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-slate-300 font-mono">
                                  {new Date(usr.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-center">
                                  {usr.email !== 'admin@paynode.com' && (
                                    <button
                                      onClick={() => handleDeleteUser(usr.id)}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors mx-auto"
                                      title={lang === 'ar' ? 'حذف المستخدم' : 'Delete User'}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>

      </div>
    </div>
  );
}
