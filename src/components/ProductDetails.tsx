import React, { useState, useEffect } from 'react';
import { Product, Language, Currency, SiteSettings } from '../types';
import { translations } from '../lib/translations';
import { 
  ArrowLeft, ArrowRight, ShoppingCart, ShieldCheck, Heart, Sparkles, 
  Zap, Play, Info, Video, HelpCircle, CheckCircle2 
} from 'lucide-react';

interface ProductDetailsProps {
  product: Product;
  allProducts: Product[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  settings: SiteSettings;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onBack: () => void;
  onViewProduct: (p: Product) => void;
  cartQty: number;
}

export default function ProductDetails({
  product,
  allProducts,
  lang,
  currency,
  exchangeRate,
  settings,
  onAddToCart,
  onBuyNow,
  onBack,
  onViewProduct,
  cartQty
}: ProductDetailsProps) {
  const t = translations[lang];
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);

  // Scroll to top when loaded or product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  // Calculate pricing
  const priceUSD = product.cost_usd + product.margin_usd;
  const calculatedPrice = currency === 'USD' 
    ? priceUSD 
    : Math.round(priceUSD * exchangeRate);

  const formattedPrice = currency === 'USD'
    ? `$${calculatedPrice.toFixed(2)}`
    : `${calculatedPrice.toLocaleString('ar-SY')} ل.س`;

  const title = lang === 'ar' ? product.title_ar : product.title_en;
  const description = lang === 'ar' ? product.description_ar : product.description_en;

  // Resolve youtube vs standard video play
  const isYoutube = product.video_path?.includes('youtube.com') || product.video_path?.includes('youtu.be');
  
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?\s*v=|\s*v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const youtubeEmbedUrl = isYoutube ? getYouTubeEmbedUrl(product.video_path) : null;

  // Find related products (same category first, excluding self, limiting to 3 active ones)
  const relatedProducts = allProducts
    .filter(p => p.is_active && p.id !== product.id)
    .sort((a, b) => {
      // Prioritize same category
      if (a.category_id === product.category_id && b.category_id !== product.category_id) return -1;
      if (a.category_id !== product.category_id && b.category_id === product.category_id) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="space-y-10 animate-fade-in" id={`product-details-container-${product.id}`}>
      
      {/* Navigation Top Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-black text-[#00E5FF] hover:text-cyan-300 transition-colors uppercase cursor-pointer py-1.5 px-3 bg-slate-900 border border-slate-850 rounded-xl"
        >
          {lang === 'ar' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{t.back_to_store}</span>
        </button>

        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded border border-slate-850">
          ID: {product.id}
        </span>
      </div>

      {/* Primary Details Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Top Hero Multimedia Banner Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 aspect-video md:aspect-[4/3] shadow-lg">
            {product.image_path ? (
              <img
                src={product.image_path}
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                <Video size={48} />
                <span className="text-xs mt-2">No Visual Asset Provided</span>
              </div>
            )}

            {/* Premium Category Sticker tag */}
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-[10px] font-extrabold text-[#00E5FF] px-3 py-1.5 rounded-lg border border-cyan-500/25 uppercase select-none tracking-wider">
              {product.category_id === 'cat-1' ? (lang === 'ar' ? 'اشتراك رقمي ممتد' : 'Premium Subscription') :
               product.category_id === 'cat-2' ? (lang === 'ar' ? 'بطاقة شحن وألعاب' : 'Game Recharge') :
               (lang === 'ar' ? 'ترخيص برامج رسمي' : 'Software License')}
            </div>
          </div>

          {/* Core Trust Attributes checklist */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3.5 select-none">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-850 pb-2">
              {lang === 'ar' ? 'مميزات وامتيازات الخدمة الرقمية' : 'Digital Perks Included'}
            </h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-[#32CD32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block">{t.instant_access}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t.delivery_badge_desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-[#32CD32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block">{lang === 'ar' ? 'تفعيل قانوني ورسمي ١٠٠٪' : '100% Legal & Official Activation'}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lang === 'ar' 
                      ? 'جميع التفعيلات تتم بروابط رسمية ومن مزودي الحسابات المباشرين دون استخدام فيزا وهمية.'
                      : 'All integrations use official routes & direct partners, ensuring lifetime validity.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Content Description & Interactions Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header titles */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1 bg-[#00E5FF]/5 border border-[#00E5FF]/10 text-[#00E5FF] px-2.5 py-1 rounded-full text-[10px] font-black select-none tracking-wide">
              <Sparkles size={8} />
              <span>{lang === 'ar' ? 'جاهز للتسليم الفوري' : 'IN STOCK & READY'}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">
              {title}
            </h1>
          </div>

          {/* Pricing Row */}
          <div className="bg-[#0A2540]/60 border border-cyan-500/15 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5 font-mono">
                {t.price}
              </span>
              <span className="text-2xl md:text-3xl font-black text-[#00E5FF] tracking-tight">
                {formattedPrice}
              </span>
            </div>

            {currency === 'SYP' && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">usd price tag ref</span>
                <span className="text-sm font-mono font-bold text-slate-400">${priceUSD.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Detailed text description */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-black uppercase text-slate-450 tracking-wider">
              {lang === 'ar' ? 'شرح وتفاصيل المنتج:' : 'Product Description:'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-wrap bg-slate-900 border border-slate-850 p-5 rounded-2xl">
              {description}
            </p>
          </div>

          {/* Purchase Operations Callouts (Buy Now vs Add to Cart) */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              {lang === 'ar' ? 'خيارات الشراء الفوري والسريع' : 'Instant Checkout Options'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Buy Now (Immediate Checkout Redirection) */}
              <button
                onClick={() => onBuyNow(product)}
                className="flex items-center justify-center gap-2 bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 px-5 py-3.5 rounded-xl text-xs font-black transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.35)] active:translate-y-[1px] cursor-pointer"
              >
                <Zap size={14} className="fill-current animate-pulse" />
                <span>{t.buy_now}</span>
              </button>

              {/* Add to current cart list */}
              <button
                onClick={() => onAddToCart(product)}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold transition-all border active:translate-y-[1px] cursor-pointer ${
                  cartQty > 0
                    ? 'bg-slate-850 text-white border-cyan-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <ShoppingCart size={14} className={cartQty > 0 ? "text-[#00E5FF] animate-bounce" : ""} />
                <span>{t.add_to_cart}</span>
                {cartQty > 0 && (
                  <span className="bg-[#0A2540] text-[#00E5FF] px-2 py-0.5 rounded text-[10px] font-black border border-cyan-500/20">
                    {cartQty}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Helper micro banner */}
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
              <Info size={11} className="text-[#00E5FF]" />
              <span>
                {lang === 'ar' 
                  ? 'الشراء الفوري يضيف المنتج للسلة ويفتح نافذة تأكيد الدفع وإصدار الفاتورة فوراً.' 
                  : 'Instant checkout automatically adds product and opens payment verification immediately.'}
              </span>
            </div>
          </div>

          {/* Support and Safety Trigger buttons - conditional on product.has_warranty */}
          <div className="flex flex-col sm:flex-row gap-3">
            {product.has_warranty !== false ? (
              <button
                onClick={() => setShowGuaranteeModal(true)}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-[#32CD32] hover:bg-emerald-500/5 py-3.5 rounded-xl border border-emerald-500/15 cursor-pointer hover:border-emerald-500/30 transition-all select-none"
              >
                <ShieldCheck size={16} />
                <span>{lang === 'ar' ? 'مشمول بكفالة باي نود الذهبية (اضغط لتفاصيل الضمان)' : 'Warranted by PayNode Gold Shield'}</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 py-3.5 rounded-xl border border-slate-805/40 select-none bg-slate-950/20">
                <ShieldCheck size={16} className="opacity-40" />
                <span>{lang === 'ar' ? 'هذا المنتج غير مشمول بالضمان الذهبي' : 'This product is not covered by Golden Warranty'}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SECTION: Video Guide (If present) */}
      {product.video_type !== 'none' && product.video_path && (
        <section className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4" id="video-guide-section">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Video size={16} className="text-[#00E5FF]" />
            <span className="text-xs font-black uppercase text-white tracking-wider">{t.video_guide_label}</span>
          </div>

          {youtubeEmbedUrl ? (
            /* YouTube Embedded frame */
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                src={youtubeEmbedUrl}
                title="Google PayNode Guide"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            /* Standard HTML5 Mp4 Video fallback */
            <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between p-4">
              <video 
                src={product.video_path} 
                controls 
                className="w-full h-full object-contain"
                preload="metadata"
              />
              <div className="text-center pt-2">
                <a 
                  href={product.video_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono hover:underline text-[#00E5FF]"
                >
                  Direct link: {product.video_path}
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Bottom Section: Products You May Also Like (منتجات قد تهمك) */}
      <section className="space-y-4 pt-4" id="related-products-section">
        <div className="border-b border-slate-850 pb-2">
          <h3 className="text-xs md:text-sm font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={14} className="animate-pulse" />
            <span>{t.related_products}</span>
          </h3>
        </div>

        {/* Mini Related products grid view */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map(p => {
            const pTitle = lang === 'ar' ? p.title_ar : p.title_en;
            const pPriceUSD = p.cost_usd + p.margin_usd;
            const pPriceFormatted = currency === 'USD'
              ? `$${pPriceUSD.toFixed(2)}`
              : `${Math.round(pPriceUSD * exchangeRate).toLocaleString('ar-SY')} ل.س`;

            return (
              <div 
                key={p.id}
                onClick={() => onViewProduct(p)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/20 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:translate-y-[-2px] flex flex-col h-full"
              >
                <div className="aspect-video bg-slate-950 overflow-hidden relative shrink-0">
                  {p.image_path ? (
                    <img 
                      src={p.image_path} 
                      alt={pTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 text-slate-700 flex items-center justify-center">
                      <Video size={18} />
                    </div>
                  )}
                  {/* Category reference micro label */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 text-[8px] font-bold text-slate-400 px-1.5 py-0.5 rounded uppercase">
                    {p.category_id === 'cat-1' ? (lang === 'ar' ? 'اشتراك' : 'Subscription') :
                     p.category_id === 'cat-2' ? (lang === 'ar' ? 'بطاقة' : 'Card') :
                     (lang === 'ar' ? 'مفتاح' : 'License')}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-[#00E5FF] transition-colors line-clamp-1">
                      {pTitle}
                    </h4>
                    <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed">
                      {lang === 'ar' ? p.description_ar : p.description_en}
                    </p>
                  </div>

                  {/* Warranty Status Indicator */}
                  <div className="pt-1.5 border-t border-slate-800/40">
                    {p.has_warranty !== false ? (
                      <div className="flex items-center gap-1 text-[10px] text-[#32CD32] font-semibold">
                        <ShieldCheck size={11} className="shrink-0" />
                        <span>{t.guarantee_badge}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                        <ShieldCheck size={11} className="shrink-0 opacity-40" />
                        <span>{lang === 'ar' ? 'بدون كفالة / ضمان' : 'No Warranty Included'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-xs font-extrabold text-[#00E5FF]">{pPriceFormatted}</span>
                    <span className="text-[9px] font-black text-slate-400 hover:text-white uppercase transition-colors">
                      {lang === 'ar' ? 'شراء وتفاصيل ⚡' : 'VIEW DETAILS ⚡'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guarantee Terms Dialog Overlay */}
      {showGuaranteeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in animate-duration-150">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="bg-[#0A2540] p-4 border-b border-cyan-500/10 flex items-center gap-3">
              <div className="p-2 bg-[#32CD32]/10 text-[#32CD32] rounded-full">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t.guarantee_title}</h4>
                <p className="text-[10px] text-slate-400">PAYNODE GOLDEN WARRANTY</p>
              </div>
            </div>

            {/* Terms list */}
            <div className="p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>{t.guarantee_terms_desc_1}</p>
              <p>{t.guarantee_terms_desc_2}</p>
              <p>
                {lang === 'ar' 
                  ? '• ضمان الاستمرارية: نضمن عمل الاشتراك طيلة فترة الصلاحية المسجلة بالفاتورة.' 
                  : '• Continuity guarantee: We warrant account active operation for full delivery duration.'}
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-mono">SUPPORT TIMELINE</span>
                <span className="text-slate-200">
                  {lang === 'ar' ? 'متابعة ودعم مستمر طوال ٢٤/٧ ساعة.' : '24/7 client center assistance.'}
                </span>
              </div>
            </div>

            {/* Bottom confirm btn */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowGuaranteeModal(false)}
                className="bg-[#0A2540] hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/40 text-[#00E5FF] px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.guarantee_close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
