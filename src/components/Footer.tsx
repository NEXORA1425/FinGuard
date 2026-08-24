import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { NavigationPage } from '../types';

interface FooterProps {
  onNavigate: (page: NavigationPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base">FinGuard</span>
              <p className="text-xs text-slate-500">Financial decision safety, before money moves.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 font-medium">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-slate-900 transition-colors cursor-pointer py-1 min-h-[36px] flex items-center"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('check')}
              className="hover:text-slate-900 transition-colors cursor-pointer py-1 min-h-[36px] flex items-center"
            >
              Check a Payment
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-slate-900 transition-colors cursor-pointer py-1 min-h-[36px] flex items-center"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="hover:text-slate-900 transition-colors cursor-pointer py-1 min-h-[36px] flex items-center"
            >
              History
            </button>
          </div>
        </div>

        {/* Safety Note */}
        <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500">
          <div className="flex items-start gap-2 max-w-2xl">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-700">Safety note:</strong> FinGuard provides decision-support based on the information provided. It does not guarantee that a payment is fraudulent or safe.
            </p>
          </div>
          <p className="text-slate-400 text-xs flex-shrink-0">
            © {new Date().getFullYear()} FinGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
