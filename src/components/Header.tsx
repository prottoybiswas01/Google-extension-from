import React from 'react';
import logoSvg from '../assets/logo.svg';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'TTC Form Auto Fill',
  subtitle = 'AI-powered document form automation',
  showBadge = true,
}) => {
  return (
    <header className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-brand-50 to-blue-100/60 border border-brand-100 shadow-sm flex items-center justify-center">
          <img src={logoSvg} alt="TTC Form Auto Fill Logo" className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
            {showBadge && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-100 text-brand-700 rounded-md uppercase tracking-wider">
                Phase 1
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-normal">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
};
