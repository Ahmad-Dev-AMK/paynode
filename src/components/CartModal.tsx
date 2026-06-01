import React, { useState } from 'react';
import { CartItem, Language, Currency, SiteSettings, Order, OrderItem } from '../types';
import { translations } from '../lib/translations';
import { X, Trash2, Plus, Minus, Send, MessageSquare, Landmark, PhoneCall, RefreshCw } from 'lucide-react';
import { dataService } from '../lib/supabase';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (pId: string, q: number) => void;
  onClearCart: () => void;
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  settings: SiteSettings;
  onOrderPlaced: () => void;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onClearCart,
  lang,
  currency,
  exchangeRate,
  settings,
  onOrderPlaced
}: CartModalProps) {
  const t = translations[lang];

  // User details state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'syriatel_cash' | 'mtn_cash' | 'sham_cash' | 'usdt'>('syriatel_cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  if (!isOpen) return null;

  // Compute subtotal and total in USD
  const subtotalUSD = cart.reduce((sum, item) => {
    const price = item.product.cost_usd + item.product.margin_usd;
    return sum + (price * item.quantity);
  }, 0);

  // Auto conversion based on target currency
  const totalInSelectedCurrency = currency === 'USD' 
    ? subtotalUSD 
    : Math.round(subtotalUSD * exchangeRate);

  const formattedTotal = currency === 'USD'
    ? `$${totalInSelectedCurrency.toFixed(2)}`
    : `${totalInSelectedCurrency.toLocaleString('ar-SY')} ل.س`;

  // Formatting helper for individual items row
  const formatItemPrice = (item: CartItem) => {
    const itemUSD = item.product.cost_usd + item.product.margin_usd;
    const finalPrice = currency === 'USD' ? itemUSD : Math.round(itemUSD * exchangeRate);
    return currency === 'USD' 
      ? `$${(finalPrice * item.quantity).toFixed(2)}` 
      : `${(finalPrice * item.quantity).toLocaleString('ar-SY')} ل.س`;
  };

  // Payment Option Availability Check from settings
  const isMethodActive = (method: string) => {
    switch (method) {
      case 'syriatel_cash': return settings.is_syriatel_cash_active;
      case 'mtn_cash': return settings.is_mtn_cash_active;
      case 'sham_cash': return settings.is_sham_cash_active;
      case 'usdt': return settings.is_usdt_active;
      default: return true;
    }
  };

  // Pre-select first active payment method if Syriatel Cash is inactive
  const getSelectedGatewayName = (methodKey: string) => {
    switch(methodKey) {
      case 'syriatel_cash': return lang === 'ar' ? 'سيريتل كاش (Syriatel Cash)' : 'Syriatel Cash';
      case 'mtn_cash': return lang === 'ar' ? 'إم تي إن كاش (MTN Cash)' : 'MTN Cash';
      case 'sham_cash': return lang === 'ar' ? 'شام كاش (Sham Cash)' : 'Sham Cash';
      case 'usdt': return lang === 'ar' ? 'تيذر الرقمي (USDT - Tron TRC20)' : 'USDT TRC20';
      default: return methodKey;
    }
  };

  // Order validation & dispatch logic
  const handleCheckout = async (destination: 'whatsapp' | 'telegram') => {
    if (cart.length === 0) return;
    
    // Quick validation
    if (!customerPhone.trim()) {
      setPhoneError(lang === 'ar' ? 'يرجى تزويدنا برقم الهاتف لتسليم الطلب!' : 'Please enter your phone number to complete order delivery!');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);

    try {
      // 1. Fetch sequential order invoice ID starting from 1
      const orderNumber = await dataService.fetchNextOrderNumber();
      
      const totalUSD = subtotalUSD;
      const totalSYP = Math.round(subtotalUSD * exchangeRate);

      // Order structure
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: orderNumber,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim(),
        user_email: localStorage.getItem('paynode_user_email') || undefined,
        total_usd: totalUSD,
        total_syp: totalSYP,
        exchange_rate_at_purchase: exchangeRate,
        payment_method: paymentMethod,
        status: 'pending'
      };

      // Items mapping
      const itemsToInsert = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_usd_at_purchase: item.product.cost_usd + item.product.margin_usd
      }));

      // 2. Dispatch to DB (Real Supabase RLS Insert OR Local Simulation DB)
      await dataService.placeOrder(newOrder, itemsToInsert);

      // 3. Formulate pre-filled chat message template
      const itemsText = cart.map((item, index) => {
        const title = lang === 'ar' ? item.product.title_ar : item.product.title_en;
        return `${index + 1}. ${title} (Qty: ${item.quantity})`;
      }).join('\n');

      const paymentMethodName = getSelectedGatewayName(paymentMethod);
      const customerInfoText = customerName.trim() ? `\n👤 Customer: ${customerName.trim()}` : '';

      const baseMessage = lang === 'ar' 
? `مرحباً متجر باي نود PayNode، أرغب في تأكيد طلبي لتفعيل خدماتي الرقمية:

🧾 رقم الفاتورة: #${orderNumber}
🛍️ المنتجات المطلوبة:
${itemsText}

💰 إجمالي حساب الطلب: ${formattedTotal}
💳 بوابة الدفع المفضلة: ${paymentMethodName}${customerInfoText}
📞 رقم المراسلة والتسليم: ${customerPhone.trim()}

يرجى إرسال تفاصيل المحفظة المالية لإتمام التحويل والدفع اليدوي الآن.`
: `Hello PayNode, I would like to confirm my digital order:

🧾 Order ID: #${orderNumber}
🛍️ Products Ordered:
${itemsText}

💰 Total Amount: ${formattedTotal}
💳 Payment Method: ${paymentMethodName}${customerInfoText}
📞 Contact Phone: ${customerPhone.trim()}

Please send me the transfer details or wallet number to complete the payment.`;

      const encodedMessage = encodeURIComponent(baseMessage);

      // Default Syrian administrator phone & telegram handles (Changeable)
      const supportNumber = '963939739157';
      const telegramUsername = 'amk1281';

      // 4. Client Redirection
      let targetUrl = '';
      if (destination === 'whatsapp') {
        const cleanNumber = supportNumber.replace('+', '');
        targetUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
      } else {
        targetUrl = `https://t.me/${telegramUsername}?text=${encodedMessage}`;
      }

      // Track hit
      await dataService.logAnalytics(`checkout-attempt-${destination}`);

      // Reset cart and checkout values
      onClearCart();
      setIsSubmitting(false);
      onClose();
      onOrderPlaced();

      // Fire click trigger externally
      window.open(targetUrl, '_blank', 'noopener,noreferrer');

    } catch (err) {
      console.error('Checkout creation fault:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm pn-fade-in">
      {/* Drawer Card */}
      <div 
        className="pn-modal-enter w-full max-w-lg bg-slate-900 h-full border-l border-slate-800 flex flex-col shadow-2xl overflow-y-auto"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">{t.cart}</span>
            <span className="text-[10px] font-mono font-black text-[#00E5FF] bg-[#0A2540] border border-cyan-500/20 px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} {t.items_count}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-slate-600 mb-4">
              <Trash2 size={40} />
            </div>
            <h4 className="text-sm font-bold text-slate-300">{t.empty_cart}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {lang === 'ar' ? 'أضف بعض المنتجات والاشتراكات لملء السلة وتأكيد حجزها!' : 'Add some incredible digital products or game cards now!'}
            </p>
          </div>
        ) : (
          /* Cart items and checkout information */
          <div className="flex-1 flex flex-col justify-between">
            
            {/* Items display container */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[35vh]">
              {cart.map(item => {
                const title = lang === 'ar' ? item.product.title_ar : item.product.title_en;
                const price = item.product.cost_usd + item.product.margin_usd;
                const singlePriceFormatted = currency === 'USD' 
                  ? `$${price.toFixed(2)}` 
                  : `${Math.round(price * exchangeRate).toLocaleString('ar-SY')} ل.س`;

                return (
                  <div 
                    key={item.product.id} 
                    className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/60"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-bold text-white truncate">{title}</p>
                      <span className="text-[10px] font-mono text-[#00E5FF] block mt-0.5">
                        {singlePriceFormatted} {lang === 'ar' ? '/ للواحد' : '/ unit'}
                      </span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-1">
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Cost final items */}
                    <div className="text-right pl-3 select-none">
                      <span className="text-xs font-black text-slate-200 block">{formatItemPrice(item)}</span>
                    </div>
                  </div>
                );
              })}

              {/* Clear checkout action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onClearCart}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>{t.clear_cart}</span>
                </button>
              </div>
            </div>

            {/* Inputs & Manual Payment Segment */}
            <div className="p-4 bg-slate-950/85 border-t border-slate-800 flex-1 space-y-4">
              
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                  <Landmark size={12} className="text-[#00E5FF]" />
                  <span>{t.checkout_subtitle}</span>
                </h4>
              </div>

              {/* Form elements */}
              <div className="space-y-3">
                
                {/* Customer Name */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    {t.customer_name_label}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل اسمك الكريم هنا' : 'Enter your name'}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-[#00E5FF] px-3 py-1.5 rounded-lg text-xs outline-none text-white font-medium"
                    maxLength={50}
                  />
                </div>

                {/* Customer Contact */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    {t.customer_phone_label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.customer_phone_placeholder}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-[#00E5FF] px-3 py-1.5 rounded-lg text-xs outline-none text-white font-mono"
                    maxLength={20}
                    required
                  />
                  {phoneError && (
                    <p className="text-[10px] text-red-400 mt-1">{phoneError}</p>
                  )}
                </div>

                {/* Local Syrian Payment Selectors (Radio Cards) */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    {t.payment_method_label}
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Syriatel Cash */}
                    {isMethodActive('syriatel_cash') && (
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        paymentMethod === 'syriatel_cash'
                          ? 'bg-[#0A2540]/60 border-[#00E5FF]/60 text-white shadow-[0_0_8px_rgba(0,229,255,0.05)]'
                          : 'bg-slate-900 border-slate-800/85 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'syriatel_cash'}
                          onChange={() => setPaymentMethod('syriatel_cash')}
                          className="accent-[#00E5FF]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold truncate">{lang === 'ar' ? 'سيريتل كاش' : 'Syriatel Cash'}</span>
                          <span className="text-[8px] opacity-60">SYP Wallet</span>
                        </div>
                      </label>
                    )}

                    {/* MTN Cash */}
                    {isMethodActive('mtn_cash') && (
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        paymentMethod === 'mtn_cash'
                          ? 'bg-[#0A2540]/60 border-[#00E5FF]/60 text-white shadow-[0_0_8px_rgba(0,229,255,0.05)]'
                          : 'bg-slate-900 border-slate-800/85 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'mtn_cash'}
                          onChange={() => setPaymentMethod('mtn_cash')}
                          className="accent-[#00E5FF]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold truncate">{lang === 'ar' ? 'إم تي إن كاش' : 'MTN Cash'}</span>
                          <span className="text-[8px] opacity-60">SYP Wallet</span>
                        </div>
                      </label>
                    )}

                    {/* Sham Cash */}
                    {isMethodActive('sham_cash') && (
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        paymentMethod === 'sham_cash'
                          ? 'bg-[#0A2540]/60 border-[#00E5FF]/60 text-white shadow-[0_0_8px_rgba(0,229,255,0.05)]'
                          : 'bg-slate-900 border-slate-800/85 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'sham_cash'}
                          onChange={() => setPaymentMethod('sham_cash')}
                          className="accent-[#00E5FF]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold truncate">{lang === 'ar' ? 'باي شام كاش' : 'Sham Cash'}</span>
                          <span className="text-[8px] opacity-60">Syrian Cards</span>
                        </div>
                      </label>
                    )}

                    {/* Tether USDT */}
                    {isMethodActive('usdt') && (
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        paymentMethod === 'usdt'
                          ? 'bg-[#0A2540]/60 border-[#00E5FF]/60 text-white shadow-[0_0_8px_rgba(0,229,255,0.05)]'
                          : 'bg-slate-900 border-slate-800/85 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'usdt'}
                          onChange={() => setPaymentMethod('usdt')}
                          className="accent-[#00E5FF]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold truncate">USDT (TRC20)</span>
                          <span className="text-[8px] opacity-60">Crypto Wallet</span>
                        </div>
                      </label>
                    )}
                  </div>

                </div>

                {/* Transfer notice */}
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 select-none">
                  <span className="text-[10px] font-bold text-amber-400 block mb-0.5">{t.how_to_pay}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t.how_to_pay_notice}
                  </p>
                </div>

              </div>

              {/* Total Summary display */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between select-none shadow-md">
                <span className="text-xs font-bold text-slate-450">{t.total_amount}:</span>
                <span className="text-xl font-bold text-[#00E5FF]">{formattedTotal}</span>
              </div>

              {/* ACTION: Confirm via WhatsApp or Telegram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleCheckout('whatsapp')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:translate-y-[1px] disabled:opacity-60 text-slate-950 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(37,211,102,0.15)]"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <MessageSquare size={14} fill="currentColor" />}
                  <span>{isSubmitting ? (lang === 'ar' ? 'جاري التجهيز...' : 'Processing...') : t.pay_via_whatsapp}</span>
                </button>
                <button
                  onClick={() => handleCheckout('telegram')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#007cbd] active:translate-y-[1px] disabled:opacity-60 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,136,204,0.15)]"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{isSubmitting ? (lang === 'ar' ? 'جاري التجهيز...' : 'Processing...') : t.pay_via_telegram}</span>
                </button>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
