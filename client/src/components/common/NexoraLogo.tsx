import React from 'react';

interface NexoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'glow';
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'glow',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-[8px]', gap: 'gap-2' },
    md: { icon: 38, text: 'text-lg', sub: 'text-[9.5px]', gap: 'gap-3' },
    lg: { icon: 52, text: 'text-2xl', sub: 'text-[11px]', gap: 'gap-3.5' },
    xl: { icon: 72, text: 'text-3xl', sub: 'text-xs', gap: 'gap-4' },
  };

  const { icon, text, sub, gap } = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${gap} select-none ${className}`}>
      {/* Dynamic Geometric Nexus Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl transition-transform hover:scale-105"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyan Energy Gradient */}
            <linearGradient id="nexoraCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="60%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#0047FF" />
            </linearGradient>

            {/* Amber Laser Gradient */}
            <linearGradient id="nexoraAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" />
              <stop offset="50%" stopColor="#FF5C00" />
              <stop offset="100%" stopColor="#E60049" />
            </linearGradient>

            {/* Deep Industrial Shadow Gradient */}
            <linearGradient id="nexoraBackdrop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E1E2F" />
              <stop offset="100%" stopColor="#050C16" />
            </linearGradient>

            {/* Glowing Core Filter */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Rounded Hexagonal Tech Shield */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="url(#nexoraBackdrop)"
            stroke="url(#nexoraCyan)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Interlocking "N" Ribbons */}
          {/* Left Vertical / Diagonal Cyan Loop */}
          <path
            d="M 26 28 L 44 18 L 44 48 L 26 62 Z"
            fill="url(#nexoraCyan)"
            opacity="0.95"
          />
          <path
            d="M 44 48 L 74 72 L 74 82 L 44 68 Z"
            fill="url(#nexoraCyan)"
            opacity="0.85"
          />

          {/* Right Vertical / Diagonal Amber Energy Loop */}
          <path
            d="M 74 72 L 56 82 L 56 52 L 74 38 Z"
            fill="url(#nexoraAmber)"
            opacity="0.95"
          />
          <path
            d="M 56 52 L 26 28 L 26 18 L 56 32 Z"
            fill="url(#nexoraAmber)"
            opacity="0.85"
          />

          {/* Isometric Cross Bevels */}
          <path
            d="M 26 28 L 44 48 L 56 52 L 74 72 L 56 82 L 44 68 L 26 62 Z"
            fill="#FFFFFF"
            fillOpacity="0.12"
          />

          {/* Central Precision Laser Core */}
          <circle cx="50" cy="50" r="5" fill="#FFFFFF" filter="url(#laserGlow)" />
          <circle cx="50" cy="50" r="2.5" fill="#00F0FF" />
          <line x1="50" y1="36" x2="50" y2="64" stroke="#00F0FF" strokeWidth="0.75" strokeOpacity="0.6" strokeDasharray="1 2" />
          <line x1="36" y1="50" x2="64" y2="50" stroke="#FF5C00" strokeWidth="0.75" strokeOpacity="0.6" strokeDasharray="1 2" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-wider ${text} ${
                variant === 'light' ? 'text-slate-900' : 'text-white'
              }`}
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em' }}
            >
              NEXORA
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs">
              OS
            </span>
          </div>
          <span
            className={`font-semibold tracking-widest uppercase ${sub} ${
              variant === 'light' ? 'text-slate-500' : 'text-cyan-300/90'
            }`}
            style={{ letterSpacing: '0.14em' }}
          >
            Videojet Maroc · Industrial OS
          </span>
        </div>
      )}
    </div>
  );
};
