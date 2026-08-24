import React, { useState } from 'react';
import { SafetyAssessment, ChecklistItem, NavigationPage } from '../types';
import { Check, ArrowLeft, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

interface SafetyPauseProps {
  assessment: SafetyAssessment;
  onGoBack: () => void;
  onDecisionAcknowledged: () => void;
  onNavigate: (page: NavigationPage) => void;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 'verify-recipient',
    label: 'Verify the recipient independently',
    description: 'Contact the recipient directly using a known phone number or trusted channel.',
    completed: false,
  },
  {
    id: 'confirm-amount',
    label: 'Confirm the payment amount',
    description: 'Verify the amount and payee match what you agreed upon.',
    completed: false,
  },
  {
    id: 'check-urgency',
    label: 'Check for unusual urgency',
    description: 'Pause if anyone is pressuring or rushing you to send money immediately.',
    completed: false,
  },
  {
    id: 'official-app',
    label: 'Use verified payment apps',
    description: 'Pay exclusively inside your official banking or UPI payment app.',
    completed: false,
  },
  {
    id: 'never-share-creds',
    label: 'Never share OTPs or PINs',
    description: 'Keep verification codes, passwords, and UPI PINs completely private.',
    completed: false,
  },
];

export const SafetyPause: React.FC<SafetyPauseProps> = ({
  assessment,
  onGoBack,
  onDecisionAcknowledged,
  onNavigate,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [isCompletedState, setIsCompletedState] = useState<boolean>(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const isAllCompleted = completedCount === totalCount;

  const handleContinue = () => {
    if (!isAllCompleted) return;
    setIsCompletedState(true);
    onDecisionAcknowledged();
  };

  // State: Decision Acknowledged
  if (isCompletedState) {
    return (
      <div className="max-w-xl mx-auto px-3.5 sm:px-6 py-8 sm:py-14 md:py-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 md:p-10 shadow-sm text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4 sm:mb-5 shadow-2xs">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Decision acknowledged
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-5 sm:mb-6 leading-relaxed">
            You reviewed the safety information before continuing.
          </p>

          {/* Payment Context Summary Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left mb-5 sm:mb-6 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Amount Checked:</span>
              <span className="font-bold text-slate-900">
                ₹{assessment.paymentDetails.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Recipient:</span>
              <span className="font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs">{assessment.paymentDetails.recipient}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Safety Score:</span>
              <span className="font-bold text-slate-900">{assessment.score} / 100 ({assessment.riskLevel})</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 mb-6 sm:mb-8 text-center font-medium leading-relaxed">
            FinGuard does not process payments. You can now complete your transaction through your preferred banking or payment app.
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-new-check"
              onClick={() => onNavigate('check')}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer min-h-[48px]"
            >
              Check a Payment
            </button>
            <button
              id="btn-view-history"
              onClick={() => onNavigate('history')}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer min-h-[48px]"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Active Safety Pause Checklist
  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Top Banner */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold mb-2.5 sm:mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Safety Pause</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Take a moment before you continue.
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
          Review these checks before making your payment.
        </p>
      </div>

      {/* Progress Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 mb-2">
          <span>Verification Progress</span>
          <span className="text-slate-600">
            <strong className="text-slate-900">{completedCount} of {totalCount} completed</strong>
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAllCompleted ? 'bg-emerald-600' : 'bg-slate-900'
            }`}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Interactive Checklist Cards */}
      <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              id={`checklist-item-${item.id}`}
              role="checkbox"
              aria-checked={item.completed}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleItem(item.id);
                }
              }}
              className={`p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[52px] ${
                item.completed
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors border ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-snug">
                    {item.label}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
        <button
          id="btn-pause-go-back"
          onClick={onGoBack}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>

        <button
          id="btn-pause-continue"
          disabled={!isAllCompleted}
          onClick={handleContinue}
          className={`w-full sm:flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all shadow-md min-h-[48px] ${
            isAllCompleted
              ? 'bg-slate-900 hover:bg-slate-800 text-white active:bg-slate-950 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
          }`}
        >
          <span>I have reviewed these safety checks</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {!isAllCompleted && (
        <p className="text-center text-xs text-slate-500 mt-3 font-medium">
          Please review and check all items above before continuing.
        </p>
      )}
    </div>
  );
};
