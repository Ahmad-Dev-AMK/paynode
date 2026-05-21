import React from 'react';
import Logo from './Logo';
import { Language, Currency } from '../types';
import { translations } from '../lib/translations';
import { Globe, ShoppingCart, ShieldAlert, Key, LogOut, DollarSign, Coins, User } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  cartCount: number;
  onCartClick: () => void;
  isAdminLoggedIn: boolean;
  isAdminSession?: boolean;
  onAdminClick: () => void;
  onLogout: () => void;
  exchangeRate: number;
  announcement?: string;
  isRealSupabaseActive: boolean;
  onTriggerSupabaseWizard: () => void;
  onHomeClick?: () => void;
}

export default function Header({
  lang,
  setLang,
  currency,
  setCurrency,
  cartCount,
  onCartClick,
  isAdminLoggedIn,
  isAdminSession,
  onAdminClick,
  onLogout,
  exchangeRate,
  announcement,
  isRealSupabaseActive,
  onTriggerSupabaseWizard,
  onHomeClick
}: HeaderProps) {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 w-full select-none" id="paynode-nav-header">
      {/* Announcement Marquee Banner (Dual Lang Support) */}
      {announcement && (
        <div className="w-full bg-[#0A2540] border-b border-cyan-500/10 py-2 overflow-hidden text-xs relative flex items-center">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-[#00E5FF] font-medium inline-block px-4">
              {announcement}
            </span>
            <span className="text-white opacity-40 inline-block px-4">|</span>
            <span className="text-[#00E5FF] font-medium inline-block px-4">
              {announcement}
            </span>
            <span className="text-white opacity-40 inline-block px-4">|</span>
            <span className="text-[#00E5FF] font-medium inline-block px-4">
              {announcement}
            </span>
          </div>
          {/* Custom marquee CSS inside style block inside the page to prevent custom loader issues for Tailwind 4 */}
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
            .animate-marquee {
              display: flex;
              animation: marquee 30s linear infinite;
            }
            [dir="rtl"] .animate-marquee {
              animation: marquee 30s linear infinite reverse;
            }
          `}</style>
        </div>
      )}

      {/* Primary Header Glass Container */}
      <div className="w-full border-b border-slate-800 bg-slate-900/90 py-3.5 px-4 md:px-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Actionable Box */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div onClick={onHomeClick} className="cursor-pointer">
              <Logo lang={lang} className="hover:opacity-90" />
            </div>
            
            {/* Real Supabase Connection Indicator on Mobile */}
            <button
              onClick={onTriggerSupabaseWizard}
              className={`flex md:hidden items-center gap-1 text-[10px] px-2 py-1 rounded border transition-all ${
                isRealSupabaseActive 
                  ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
                  : 'border-orange-500/20 text-orange-400 bg-orange-500/5'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isRealSupabaseActive ? 'bg-emerald-400' : 'bg-orange-400 animate-ping'}`} />
              <span>{isRealSupabaseActive ? 'BaaS: Online' : 'Local Sandbox'}</span>
            </button>
          </div>

          {/* Controls Actions Rail */}
          <div className="flex items-center flex-wrap justify-center gap-3 md:gap-4 w-full md:w-auto">

            {/* Currency Switcher Toggle with icon */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                id="currency-syp-btn"
                onClick={() => setCurrency('SYP')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors font-medium ${
                  currency === 'SYP' 
                    ? 'bg-[#0A2540] text-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.1)] border border-cyan-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins size={12} />
                <span>ل.س</span>
              </button>
              <button
                id="currency-usd-btn"
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors font-medium ${
                  currency === 'USD' 
                    ? 'bg-[#0A2540] text-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.1)] border border-cyan-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={12} />
                <span>USD</span>
              </button>
            </div>

            {/* Language Switcher Button toggle [AR/EN] */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-slate-700 transition-colors"
            >
              <Globe size={14} className="text-[#00E5FF]" />
              <span>{t.lang_toggle}</span>
            </button>

            {/* Glowing Order Cart Icon */}
            <button
              id="cart-trigger-btn"
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-[#0A2540]/60 text-white border border-[#00E5FF]/20 hover:border-[#00E5FF]/40 px-4 py-1.5 rounded-lg text-xs font-semibold select-none group transition-all"
            >
              <ShoppingCart size={15} className="text-[#00E5FF] group-hover:scale-110 transition-transform" />
              <span>{t.cart}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Administrator Dashboard Access Buttons */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <LogOut size={13} />
                  <span>{t.admin_logout}</span>
                </button>
                <button
                  id="admin-panel-btn-active"
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_12px_rgba(0,229,255,0.25)] transition-shadow"
                >
                  {isAdminSession ? <Key size={13} /> : <User size={13} />}
                  <span>{isAdminSession ? (lang === 'ar' ? 'إدارة الموقع' : 'Site Admin') : (lang === 'ar' ? 'حالة طلباتي' : 'My Orders')}</span>
                </button>
              </div>
            ) : (
              <button
                id="admin-login-trigger"
                onClick={onAdminClick}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-[#00E5FF] px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all"
              >
                <User size={13} className="text-[#00E5FF]" />
                <span>{t.login}</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
