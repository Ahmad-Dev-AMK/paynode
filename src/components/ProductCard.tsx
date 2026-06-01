import React, { useState, useRef, useEffect } from 'react';
import { Product, Language, Currency } from '../types';
import { translations } from '../lib/translations';
import { ShieldCheck, Info, ShoppingCart, HelpCircle, Film, PlayCircle } from 'lucide-react';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  onAddToCart: (p: Product) => void;
  onViewDetails: (p: Product) => void;
  cartQty: number;
}

export default function ProductCard({
  product,
  lang,
  currency,
  exchangeRate,
  onAddToCart,
  onViewDetails,
  cartQty
}: ProductCardProps) {
  const t = translations[lang];
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);

  // Calculate price: Base Cost + Margin in USD
  const priceUSD = product.cost_usd + product.margin_usd;
  // Convert based on selected currency
  const calculatedPrice = currency === 'USD' 
    ? priceUSD 
    : Math.round(priceUSD * exchangeRate);

  const formattedPrice = currency === 'USD'
    ? `$${calculatedPrice.toFixed(2)}`
    : `${calculatedPrice.toLocaleString('ar-SY')} ل.س`;

  // Display fields according to active language
  const title = lang === 'ar' ? product.title_ar : product.title_en;
  const description = lang === 'ar' ? product.description_ar : product.description_en;

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) {
      el.classList.add('loaded');
    } else {
      el.addEventListener('load', () => el.classList.add('loaded'));
    }
  }, [product.image_path]);

  return (
    <article 
      className="pn-card-enter relative flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/25 transition-all group paynode-glow hover:translate-y-[-2px] h-full"
      id={`product-card-${product.id}`}
    >
      {/* Dynamic Media Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative w-full aspect-video md:aspect-[4/3] bg-slate-950 overflow-hidden shrink-0 cursor-pointer"
      >
        {product.image_path ? (
          <img
            ref={imgRef}
            src={product.image_path}
            alt={title}
            loading="lazy"
            decoding="async"
            className="pn-lazy w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-700">
            <Film size={32} />
            <span className="text-[10px] mt-1">PayNode Digital Asset</span>
          </div>
        )}

        {/* Video Mode indicator overlay */}
        {product.video_type !== 'none' && product.video_path && (
          <div className="absolute top-2.5 right-2.5 bg-cyan-950/85 text-[#00E5FF] px-2 py-1 rounded-md text-[10px] font-bold border border-cyan-500/20 flex items-center gap-1.5 backdrop-blur-sm z-10">
            <PlayCircle size={10} className="animate-pulse" />
            <span>PLAY VIDEO</span>
          </div>
        )}

        {/* Category specific label */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-slate-350 tracking-wide px-2.5 py-1 rounded border border-slate-800 uppercase">
          {product.category_id === 'cat-1' ? (lang === 'ar' ? 'اشتراك' : 'Subscription') :
           product.category_id === 'cat-2' ? (lang === 'ar' ? 'بطاقة شحن' : 'Game Card') :
           (lang === 'ar' ? 'ترخيص' : 'Software Key')}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Clickable Info Area */}
        <div 
          onClick={() => onViewDetails(product)}
          className="cursor-pointer group/content flex-grow flex flex-col"
        >
          {/* Title */}
          <h3 className="text-sm font-bold text-white tracking-tight line-clamp-2 min-h-[40px] leading-snug group-hover:text-[#00E5FF] transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed flex-grow">
            {description}
          </p>
        </div>

        {/* Price Tag with auto-conversion */}
        <div className="flex items-baseline justify-between mt-4 pb-3 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              {t.price}
            </span>
            <span className="text-base font-extrabold text-[#00E5FF]">
              {formattedPrice}
            </span>
          </div>
          
          {/* Active currency original reference */}
          {currency === 'SYP' && (
            <span className="text-[11px] font-mono font-medium text-slate-500">
              (${priceUSD.toFixed(2)})
            </span>
          )}
        </div>

        {/* Interaction Elements */}
        <div className="flex flex-col gap-2 mt-3">
          
          {/* Guarantee terms triggers - conditional on product.has_warranty */}
          {product.has_warranty !== false ? (
            <button
              onClick={() => setShowGuaranteeModal(true)}
              className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#32CD32] hover:bg-emerald-500/5 py-1.5 rounded-lg border border-emerald-500/15 cursor-pointer hover:border-emerald-500/30 transition-colors w-full"
              title="Guarantee Policy"
            >
              <ShieldCheck size={13} />
              <span>{t.guarantee_badge}</span>
              <Info size={11} className="opacity-60" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 py-1.5 rounded-lg border border-slate-805/50 select-none w-full bg-slate-950/20">
              <ShieldCheck size={13} className="opacity-40" />
              <span>{lang === 'ar' ? 'بدون كفالة / ضمان' : 'No Warranty Included'}</span>
            </div>
          )}

          {/* Add to Shopping Cart with feedback indicator */}
          <button
            onClick={() => onAddToCart(product)}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              cartQty > 0
                ? 'bg-slate-800 border border-cyan-500/40 text-white hover:bg-slate-750'
                : 'bg-[#00E5FF] hover:bg-cyan-400 border border-transparent text-slate-950 hover:shadow-[0_0_12px_rgba(0,229,255,0.3)]'
            }`}
          >
            <ShoppingCart size={13} className={cartQty > 0 ? "text-[#00E5FF]" : ""} />
            <span>{t.add_to_cart}</span>
            {cartQty > 0 && (
              <span className="bg-[#0A2540] text-[#00E5FF] px-2 py-0.5 rounded text-[10px] font-black border border-cyan-500/20">
                {cartQty}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Floating Guarantee Policy Modal Overlay */}
      {showGuaranteeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div 
            className="pn-modal-enter w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
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
    </article>
  );
}
