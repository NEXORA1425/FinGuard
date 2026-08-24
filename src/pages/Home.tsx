import React from 'react';
import { NavigationPage } from '../types';
import { ShieldCheck, PauseCircle, HelpCircle, CheckCircle2, ArrowRight, AlertTriangle, Lock } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: NavigationPage) => void;
  onQuickPresetSelect?: (presetIndex: number) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 md:pt-18 md:pb-24 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 text-left space-y-5 sm:space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Financial Decision Safety Layer</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.1]">
                Don’t just secure the transaction.{' '}
                <span className="text-slate-500 block sm:inline">Secure the decision.</span>
              </h1>

              {/* Supporting Subtext */}
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-xl leading-relaxed">
                FinGuard helps you understand potential financial risks before you commit to a payment.
              </p>

              {/* Action Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  id="hero-primary-cta"
                  onClick={() => onNavigate('check')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 cursor-pointer min-h-[48px]"
                >
                  <span>Check a Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Subtle Trust Note */}
              <p className="text-xs text-slate-500 font-medium">
                No payment processing • Decision support only
              </p>

              {/* 3 Core Principles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 max-w-xl">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-xs text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center sm:mb-2 flex-shrink-0">
                    <PauseCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">Pause</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Slow down rush</div>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-xs text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center sm:mb-2 flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">Understand</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Clear risk signals</div>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-xs text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center sm:mb-2 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">Decide</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Informed choice</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Example Safety Check */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-7 flex flex-col relative">
                {/* Card Top Label */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Example Safety Check</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Illustration</span>
                </div>

                {/* Score Gauge Circle */}
                <div className="flex flex-col items-center justify-center my-1 sm:my-2">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        strokeDasharray={314.159}
                        strokeDashoffset={314.159 * (1 - 0.32)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <div className="flex items-baseline">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">32</span>
                        <span className="text-xs font-semibold text-slate-400 ml-0.5">/ 100</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Safety Score
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>REVIEW BEFORE PAYING</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Based on the information provided.</span>
                </div>

                {/* Risk Factors Highlight */}
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">First-time recipient</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">This is your first payment to this recipient.</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Urgent request</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Urgent timing increases the chance of hasty decisions.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Flow: Enter → Check → Understand → Pause → Decide */}
      <section className="py-12 sm:py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
              How It Works
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">
              Enter → Check → Understand → Pause → Decide
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center sm:mx-auto sm:mb-2 text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Enter</div>
                <div className="text-xs text-slate-500 mt-0.5">Payment details</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center sm:mx-auto sm:mb-2 text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Check</div>
                <div className="text-xs text-slate-500 mt-0.5">Look for risk signals</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center sm:mx-auto sm:mb-2 text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Understand</div>
                <div className="text-xs text-slate-500 mt-0.5">See what was found</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center sm:mx-auto sm:mb-2 text-xs font-bold flex-shrink-0">
                4
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Pause</div>
                <div className="text-xs text-slate-500 mt-0.5">Review checklist</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-0 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center sm:mx-auto sm:mb-2 text-xs font-bold flex-shrink-0">
                5
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Decide</div>
                <div className="text-xs text-slate-500 mt-0.5">Make informed choice</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Approach Section */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* The Problem */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full inline-block mb-3">
              The Problem
            </span>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2.5">
              Speed works against good decision-making
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              Digital payments are designed to make transactions fast. But when a payment is urgent, unfamiliar, or unusually large, speed can work against good decision-making.
            </p>
          </div>

          {/* Our Approach */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mb-3">
              Our Approach
            </span>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2.5">
              A safety checkpoint before money moves
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              FinGuard adds a safety checkpoint before the money moves. We give you transparent risk signals, a deliberate verification pause, and complete control over your payment decision.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Boundary Banner */}
      <section className="pb-12 sm:pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-9 md:p-10 text-white shadow-xl relative overflow-hidden text-center">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium mb-3 sm:mb-4">
              <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>No payment processing • Decision support only</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-2.5 sm:mb-3">
              Ready to check a payment?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-5 sm:mb-6 leading-relaxed">
              Understand potential risks and review your safety checklist before you commit.
            </p>
            <button
              id="home-bottom-check-btn"
              onClick={() => onNavigate('check')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-md transition-all cursor-pointer min-h-[48px]"
            >
              <span>Check a Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
