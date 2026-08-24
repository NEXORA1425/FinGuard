import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, Loader2, Circle } from 'lucide-react';

interface AnalysisProps {
  onComplete: () => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    // Step 1: Reviewing payment context
    const t1 = setTimeout(() => {
      setStep(2); // Step 2: Checking for potential risk signals
    }, 850);

    const t2 = setTimeout(() => {
      setStep(3); // Step 3: Preparing your safety assessment
    }, 1700);

    const t3 = setTimeout(() => {
      onComplete(); // Navigate to Result
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center">
        {/* Pulse Shield */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="relative w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Reviewing Payment
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-8">
          Analyzing payment details against known risk patterns...
        </p>

        {/* 3 Sequential Steps */}
        <div className="space-y-4 text-left max-w-xs mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-3.5 transition-all">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > 1
                  ? 'bg-emerald-600 text-white'
                  : step === 1
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step > 1 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
            </div>
            <span
              className={`text-sm ${
                step >= 1 ? 'font-semibold text-slate-900' : 'text-slate-400'
              }`}
            >
              Reviewing payment context...
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3.5 transition-all">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > 2
                  ? 'bg-emerald-600 text-white'
                  : step === 2
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {step > 2 ? (
                <Check className="w-3.5 h-3.5" />
              ) : step === 2 ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Circle className="w-2.5 h-2.5 fill-slate-300 text-slate-300" />
              )}
            </div>
            <span
              className={`text-sm ${
                step >= 2 ? 'font-semibold text-slate-900' : 'text-slate-400'
              }`}
            >
              Checking for potential risk signals...
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3.5 transition-all">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === 3
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {step === 3 ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Circle className="w-2.5 h-2.5 fill-slate-300 text-slate-300" />
              )}
            </div>
            <span
              className={`text-sm ${
                step === 3 ? 'font-semibold text-slate-900' : 'text-slate-400'
              }`}
            >
              Preparing your safety assessment...
            </span>
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="mt-8 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-slate-900 h-full transition-all duration-700 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

