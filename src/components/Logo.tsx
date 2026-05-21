import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subTextClassName?: string;
  lang?: 'ar' | 'en';
}

export default function Logo({
  className = '',
  size = 48,
  showText = true,
  subTextClassName = '',
  lang = 'ar'
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Vector Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_0_8px_rgba(0,229,255,0.25)]"
      >
        {/* Hexagonal Connection Paths */}
        <polygon
          points="50,15 80,32 80,68 50,85 20,68 20,32"
          stroke="#0A2540"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeDasharray="1, 1"
        />
        <polygon
          points="50,15 80,32 80,68 50,85 20,68 20,32"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Outer Node Circles (Hexagon Vertices) */}
        <circle cx="50" cy="15" r="5" fill="#00E5FF" stroke="#0f172a" strokeWidth="2.5" />
        <circle cx="80" cy="32" r="5" fill="#0A2540" stroke="#00E5FF" strokeWidth="2.0" />
        <circle cx="80" cy="68" r="5" fill="#00E5FF" stroke="#0f172a" strokeWidth="2.5" />
        <circle cx="50" cy="85" r="5" fill="#0A2540" stroke="#00E5FF" strokeWidth="2.0" />
        <circle cx="20" cy="68" r="5" fill="#00E5FF" stroke="#0f172a" strokeWidth="2.5" />
        <circle cx="20" cy="32" r="5" fill="#0A2540" stroke="#00E5FF" strokeWidth="2.0" />

        {/* Network Connections meeting at Center Card */}
        <line x1="50" y1="15" x2="50" y2="35" stroke="url(#lineGradient)" strokeWidth="1.5" />
        <line x1="80" y1="32" x2="68" y2="42" stroke="url(#lineGradient)" strokeWidth="1.5" />
        <line x1="80" y1="68" x2="68" y2="58" stroke="url(#lineGradient)" strokeWidth="1.5" />
        <line x1="50" y1="85" x2="50" y2="65" stroke="url(#lineGradient)" strokeWidth="1.5" />
        <line x1="20" y1="68" x2="32" y2="58" stroke="url(#lineGradient)" strokeWidth="1.5" />
        <line x1="20" y1="32" x2="32" y2="42" stroke="url(#lineGradient)" strokeWidth="1.5" />

        {/* Center Digital Credit Card Panel */}
        <g transform="translate(32, 38)">
          <rect
            width="36"
            height="24"
            rx="4"
            fill="#0A2540"
            stroke="#00E5FF"
            strokeWidth="2"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          {/* Chip */}
          <rect x="4" y="5" width="7" height="5" rx="1" fill="#FFD700" />
          {/* Card Lines/Design */}
          <line x1="14" y1="7" x2="30" y2="7" stroke="#00E5FF" strokeWidth="1.2" opacity="0.6" />
          <line x1="14" y1="11" x2="26" y2="11" stroke="#00E5FF" strokeWidth="1.2" opacity="0.4" />
          <line x1="4" y1="17" x2="16" y2="17" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" />
          {/* Mini Node Spot */}
          <circle cx="30" cy="17" r="2.5" fill="#00E5FF" />
          <circle cx="25" cy="17" r="1.5" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* Definitions */}
        <defs>
          <linearGradient id="glowGradient" x1="20" y1="15" x2="80" y2="85">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#0A2540" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="50" y1="15" x2="50" y2="85">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0A2540" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Text Elements (Arabic/English adaptive) */}
      {showText && (
        <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white font-sans">
              {lang === 'ar' ? 'باي نود' : 'PayNode'}
            </span>
            {lang === 'ar' && (
              <span className="text-[10px] tracking-widest text-[#00E5FF] font-black font-sans uppercase">
                PAYNODE
              </span>
            )}
          </div>
          <span className={`text-[9px] font-bold tracking-widest text-slate-400 uppercase ${subTextClassName}`}>
            {lang === 'ar'
              ? 'اشتراكات . سرعة . موثوقية'
              : 'PAYMENTS. SUBSCRIPTIONS. CONNECTED.'}
          </span>
        </div>
      )}
    </div>
  );
}
