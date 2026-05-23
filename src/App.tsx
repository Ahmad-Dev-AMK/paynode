import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import CartModal from './components/CartModal';
import AdminDashboard from './components/AdminDashboard';
import { Category, Product, SiteSettings, CartItem, Language, Currency } from './types';
import { translations } from './lib/translations';
import { dataService } from './lib/supabase';
import { 
  ShieldCheck, Zap, Heart, Search, Smartphone, ListFilter, AlertCircle, Sparkles, Check, CheckCircle2, ChevronRight, RefreshCw, Globe, Instagram, Facebook, Send
} from 'lucide-react';

export default function App() {
  // Localization Configurations (Default to Arabic for local Syrian audience, but immediately toggleable)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('paynode_pref_lang') as Language) || 'ar';
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('paynode_pref_currency') as Currency) || 'SYP';
  });

  const t = translations[lang];

  // Core Storefront Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    id: 'settings-row',
    usd_to_syp_rate: 15200,
    is_syriatel_cash_active: true,
    is_mtn_cash_active: true,
    is_sham_cash_active: true,
    is_usdt_active: true,
    announcement_ar: '🔥 عروض الصيف الكبرى من متجر باي نود! تسليم فوري وضمان كامل.',
    announcement_en: '🔥 Great Summer Deals from PayNode! Instant delivery & gold warranty.'
  });

  // UI Filtering & Search parameters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc'>('recommended');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Shopping Cart & Modals Toggles State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pn_cart_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('paynode_admin_logged_in') === 'true';
  });
  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    return localStorage.getItem('paynode_user_email') || '';
  });
  const isAdminSession = loggedInEmail === 'admin@paynode.com';
  const [isSupabaseWizardOpen, setIsSupabaseWizardOpen] = useState(false);
  const [orderCompleteToast, setOrderCompleteToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Connection mode helpers
  const isRealSupabaseActive = dataService.isRealMode();

  // Load Categories & Products on Startup
  useEffect(() => {
    fetchStoreData();
    // Log platform analytics entry point hit
    dataService.logAnalytics('home');
  }, []);

  // Save cart changes helper
  useEffect(() => {
    localStorage.setItem('pn_cart_data', JSON.stringify(cart));
  }, [cart]);

  // Persist language/currency preferences
  useEffect(() => {
    localStorage.setItem('paynode_pref_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('paynode_pref_currency', currency);
  }, [currency]);

  const fetchStoreData = async () => {
    setIsLoading(true);
    try {
      const cats = await dataService.fetchCategories();
      const prods = await dataService.fetchProducts();
      const siteConf = await dataService.fetchSettings();

      setCategories(cats);
      setProducts(prods);
      setSettings(siteConf);
    } catch (err) {
      console.error('Error fetching storefront dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // CART OPERATIONS
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleBuyNow = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev => prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQty } 
          : item
      ));
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Callback once user completes order checkout
  const handleOrderCompletion = () => {
    setOrderCompleteToast(true);
    setTimeout(() => {
      setOrderCompleteToast(false);
    }, 6000);
  };

  // Filter products based on search query and active tab selection
  const filteredProducts = products.filter(prod => {
    if (!prod.is_active) return false;
    
    const matchesCategory = selectedCategory === 'all' || prod.category_id === selectedCategory;
    
    const title = lang === 'ar' ? prod.title_ar : prod.title_en;
    const desc = lang === 'ar' ? prod.description_ar : prod.description_en;
    const matchSearch = searchQuery.trim() === '' || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') {
      const priceA = a.cost_usd + a.margin_usd;
      const priceB = b.cost_usd + b.margin_usd;
      return priceA - priceB;
    }
    if (sortBy === 'price_desc') {
      const priceA = a.cost_usd + a.margin_usd;
      const priceB = b.cost_usd + b.margin_usd;
      return priceB - priceA;
    }
    if (sortBy === 'recommended') {
      const scoreA = a.is_best_seller ? 1 : 0;
      const scoreB = b.is_best_seller ? 1 : 0;
      return scoreB - scoreA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0f172a] text-slate-100" id="paynode-root-canvas">
      
      {/* Dynamic Header Coordination Navigation bar */}
      <Header
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        isAdminSession={isAdminSession}
        onAdminClick={() => setIsAdminOpen(true)}
        onLogout={() => {
          localStorage.removeItem('paynode_admin_logged_in');
          localStorage.removeItem('paynode_user_email');
          setIsAdminLoggedIn(false);
          setLoggedInEmail('');
          fetchStoreData(); // Re-trigger fetching clean data
        }}
        exchangeRate={settings.usd_to_syp_rate}
        announcement={lang === 'ar' ? settings.announcement_ar : settings.announcement_en}
        isRealSupabaseActive={isRealSupabaseActive}
        onTriggerSupabaseWizard={() => {
          setIsAdminOpen(true);
        }}
        onHomeClick={() => setActiveProduct(null)}
      />

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 flex-1 space-y-8">



        {/* Global Toast Alert once user checks out */}
        {orderCompleteToast && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-xs font-semibold flex items-center gap-3 shadow-xl animate-fade-in" id="order-complete-toast">
            <CheckCircle2 size={24} className="text-[#32CD32] animate-bounce" />
            <div>
              <span className="text-white font-bold block">{lang === 'ar' ? 'تم تجميع بيانات الاشتراك والطلب جاهز!' : 'Order Generated & Ready!'}</span>
              <p className="text-slate-400 font-medium text-[11px] mt-0.5">
                {lang === 'ar' ? 'يرجى إرسال الرسالة التلقائية في نافذة المحادثة (الواتساب/التلغرام) للتفعيل الفوري من فريق الدعم.' : 'Please send the pre-filled message in the messaging app chat for immediate support.'}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Details View Portal VS main storefront catalog grid */}
        {activeProduct ? (
          <ProductDetails
            product={activeProduct}
            allProducts={products}
            lang={lang}
            currency={currency}
            exchangeRate={settings.usd_to_syp_rate}
            settings={settings}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onBack={() => setActiveProduct(null)}
            onViewProduct={(p) => setActiveProduct(p)}
            cartQty={cart.find(item => item.product.id === activeProduct.id)?.quantity || 0}
          />
        ) : (
          <>
            {/* SECTION A: Brand Hero visual card representator */}
            <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0f172a] to-[#010912] border border-slate-800 p-8 md:p-12 text-center space-y-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="relative space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-[#00E5FF]/5 border border-[#00E5FF]/10 text-[#00E5FF] font-black tracking-widest text-[9px] uppercase px-3 py-1.5 rounded-full select-none">
                  <Sparkles size={10} className="animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{lang === 'ar' ? 'الشبكة السورية الأسرع للاشتراكات' : 'FASTEST SYRIAN DIGITAL OUTLET'}</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight md:leading-tight pt-4 md:pt-5 font-sans">
                  {lang === 'ar' ? 'امتلك مفاتيح العالم الرقمي بنقرة واحدة' : 'Connect and Power Your Subscriptions'}
                </h1>
                
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                  {lang === 'ar' 
                    ? 'متجر "باي نود" يوفر لك تفعيل آمن وسريع مع ضمان ١٠٪ للمنتجات والاشتراكات المشمولة بالكفالة الذهبية في سوريا وبأفضل الأسعار.'
                    : 'PayNode gives you secure digital activation, with 100% warranty on all covered plans and licenses in Syrian Pounds.'}
                </p>
              </div>

              {/* Core Trust Badges (3 Minimalist Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto select-none">
                {/* Secure Payments */}
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 hover:border-cyan-500/10 transition-colors">
                  <div className="p-2.5 bg-[#0A2540] text-[#00E5FF] rounded-lg border border-cyan-500/15">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-white block">{t.security_badge}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.security_badge_desc}</p>
                  </div>
                </div>

                {/* Instant Delivery */}
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 hover:border-cyan-500/10 transition-colors">
                  <div className="p-2.5 bg-[#0A2540] text-[#00E5FF] rounded-lg border border-cyan-500/15">
                    <Zap size={20} className="text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-white block">{t.delivery_badge}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.delivery_badge_desc}</p>
                  </div>
                </div>

                {/* Platinum Guarantee */}
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 hover:border-cyan-500/10 transition-colors">
                  <div className="p-2.5 bg-[#0A2540] text-[#32CD32] rounded-lg border border-emerald-500/15">
                    <Heart size={20} />
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-white block">{t.guarantee_badge}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.guarantee_badge_desc}</p>
                  </div>
                </div>
              </div>

            </section>

            {/* 1. Best Sellers Section */}
            {products.filter(p => p.is_active && p.is_best_seller).length > 0 && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                  <span className="text-amber-400 animate-pulse text-base">🔥</span>
                  <h3 className="text-sm md:text-base font-extrabold text-[#FFD700] tracking-wide uppercase">
                    {lang === 'ar' ? 'العروض الأكثر مبيعاً' : 'Best Sellers'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => p.is_active && p.is_best_seller).map(prod => {
                    const cartItem = cart.find(i => i.product.id === prod.id);
                    const cartQty = cartItem ? cartItem.quantity : 0;
                    return (
                      <ProductCard
                        key={`best-${prod.id}`}
                        product={prod}
                        lang={lang}
                        currency={currency}
                        exchangeRate={settings.usd_to_syp_rate}
                        onAddToCart={handleAddToCart}
                        onViewDetails={(p) => setActiveProduct(p)}
                        cartQty={cartQty}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. New Arrivals Section */}
            {products.filter(p => p.is_active && p.is_new_release).length > 0 && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                  <span className="text-orange-500 animate-bounce text-base">🎉</span>
                  <h3 className="text-sm md:text-base font-extrabold text-orange-500 tracking-wide uppercase">
                    {lang === 'ar' ? 'جديدنا وأحدث الإضافات' : 'New Arrivals'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => p.is_active && p.is_new_release).map(prod => {
                    const cartItem = cart.find(i => i.product.id === prod.id);
                    const cartQty = cartItem ? cartItem.quantity : 0;
                    return (
                      <ProductCard
                        key={`new-${prod.id}`}
                        product={prod}
                        lang={lang}
                        currency={currency}
                        exchangeRate={settings.usd_to_syp_rate}
                        onAddToCart={handleAddToCart}
                        onViewDetails={(p) => setActiveProduct(p)}
                        cartQty={cartQty}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Browse categories & explore section */}
            <section className="space-y-6 pt-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-850 pb-3 select-none">
                <div className="space-y-1">
                  <h2 className="text-sm md:text-base font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
                    <ListFilter size={18} className="text-[#00E5FF]" />
                    <span>{lang === 'ar' ? 'تصفح الأقسام والتصنيفات' : 'Browse Categories'}</span>
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 h-10 shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      {lang === 'ar' ? 'الترتيب حسب:' : 'Sort By:'}
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-xs text-white font-bold outline-none cursor-pointer focus:ring-0"
                    >
                      <option className="bg-slate-950 text-white" value="recommended">{lang === 'ar' ? 'الأكثر مبيعاً أولاً' : 'Best Sellers'}</option>
                      <option className="bg-slate-950 text-white" value="price_asc">{lang === 'ar' ? 'السعر: من الأرخص للأغلى' : 'Price: Low to High'}</option>
                      <option className="bg-slate-950 text-white" value="price_desc">{lang === 'ar' ? 'السعر: من الأعلى للأرخص' : 'Price: High to Low'}</option>
                    </select>
                  </div>

                  {/* Fluid quick search bar */}
                  <div className="relative w-full sm:w-64 h-10">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onInput={(e) => dataService.logAnalytics('search')}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.search_placeholder}
                      className="w-full h-full bg-slate-900 border border-slate-800 focus:border-[#00E5FF] pl-9 pr-4 py-2 rounded-xl text-xs text-white outline-none font-medium placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tab lists */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                {/* ALL */}
                <button
                  id="category-filter-all"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#00E5FF] text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.all_categories}
                </button>
                
                {/* Dynamic listings */}
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    id={`category-filter-${cat.id}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      dataService.logAnalytics(`category-${cat.slug}`);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#00E5FF] text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {lang === 'ar' ? cat.name_ar : cat.name_en}
                  </button>
                ))}
              </div>

              {/* Grid content */}
              {isLoading ? (
                /* Loading states fallback card */
                <div className="py-24 text-center space-y-3 select-none">
                  <RefreshCw className="animate-spin text-[#00E5FF] mx-auto" size={32} />
                  <p className="text-xs text-slate-550 font-mono tracking-wide">CONNECTING TO GATEWAY NODE...</p>
                </div>
              ) : sortedProducts.length === 0 ? (
                /* Empty list */
                <div className="py-20 text-center select-none bg-slate-900/10 border border-slate-850 p-8 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400">
                    {lang === 'ar' ? 'لم يعثر على أي منتجات مطابقة للبحث أو القسم!' : 'No matching products found!'}
                  </span>
                  <p className="text-[11px] text-slate-550 mt-1">
                    {lang === 'ar' ? 'يرجى مراجعة إملاء الحروف ثانية أو تصفح قسماً مغايراً.' : 'Try searching again or inspect other active lists.'}
                  </p>
                </div>
              ) : (
                /* Layout Cards grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map(prod => {
                    const cartItem = cart.find(i => i.product.id === prod.id);
                    const cartQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        lang={lang}
                        currency={currency}
                        exchangeRate={settings.usd_to_syp_rate}
                        onAddToCart={handleAddToCart}
                        onViewDetails={(p) => setActiveProduct(p)}
                        cartQty={cartQty}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </main>

      {/* Persistent Page Footer section */}
      <footer className="bg-slate-950 border-t border-slate-850 mt-12 py-8 px-4 text-center select-none">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-xs text-slate-500">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 max-w-sm mb-2">
            <p className="text-slate-300 font-bold mb-3 text-[13px]">
              {lang === 'ar' ? 'طلبك مو موجود؟ حاكينا خاص ونوفرلك شو ما بدك!' : 'Item not found? Contact us privately and we will provide what you want!'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="https://wa.me/963939739157" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg transition-colors font-bold">
                <Smartphone size={14} />
                <span>WhatsApp</span>
              </a>
              <a href="https://t.me/amk1281" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-lg transition-colors font-bold">
                <Globe size={14} />
                <span>Telegram</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-300 font-bold mb-1 text-[12px] uppercase">
              {lang === 'ar' ? 'لمتابعة آخر العروض والخصومات الحصرية تابعونا عبر :' : 'To follow our latest exclusive offers and discounts, follow us on:'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <a href="https://www.instagram.com/_paynode" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 border border-[#E1306C]/20 rounded-lg transition-colors font-bold shadow-lg shadow-[#E1306C]/5">
                <Instagram size={14} />
                <span>Instagram</span>
              </a>
              <a href="https://www.facebook.com/people/Paynode/61590397795777/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/20 rounded-lg transition-colors font-bold shadow-lg shadow-[#1877F2]/5">
                <Facebook size={14} />
                <span>Facebook</span>
              </a>
              <a href="https://t.me/paynode112" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-lg transition-colors font-bold shadow-lg shadow-[#0088cc]/5">
                <Send size={14} />
                <span>Telegram</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <span>© 2026 </span>
              <span className="text-slate-350 font-bold">PayNode Inc</span>
              <span>. All Rights Reserved.</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {lang === 'ar' ? 'عمل هذا الموقع المبرمج تيلجرام ' : 'Website created by developer on Telegram '}
              <a href="https://t.me/amk1281" target="_blank" rel="noreferrer" className="text-[#0088cc] hover:underline font-bold">@amk1281</a>
            </div>
          </div>
        </div>
      </footer>

      {/* PORTAL MODALS COORDINATION OVERLAYS */}
      
      {/* Shopping Cart Drawer Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={handleClearCart}
        lang={lang}
        currency={currency}
        exchangeRate={settings.usd_to_syp_rate}
        settings={settings}
        onOrderPlaced={handleOrderCompletion}
      />

      {/* Admin Dashboard Protected Layer */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        onRefreshData={fetchStoreData}
        categories={categories}
        products={products}
        settings={settings}
        isRealSupabaseActive={isRealSupabaseActive}
        isAdminLoggedIn={isAdminLoggedIn}
        onLoginStateChange={setIsAdminLoggedIn}
      />

    </div>
  );
}
