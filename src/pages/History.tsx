import React, { useState } from 'react';
import { SafetyAssessment, NavigationPage } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar, ArrowRight, Trash2, Search, X } from 'lucide-react';

interface HistoryProps {
  history: SafetyAssessment[];
  onClearHistory: () => void;
  onSelectAssessment: (assessment: SafetyAssessment) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const History: React.FC<HistoryProps> = ({
  history,
  onClearHistory,
  onSelectAssessment,
  onNavigate,
}) => {
  const [selectedItem, setSelectedItem] = useState<SafetyAssessment | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Safety Check History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review past payment evaluations and risk score records.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => onNavigate('check')}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[40px]"
            >
              Check a Payment
            </button>
            <button
              onClick={onClearHistory}
              className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Clear history"
              aria-label="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* History List or Empty State */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">No payments checked yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5 sm:mb-6">
            When you evaluate payment requests, your safety assessments and risk scores will appear here.
          </p>
          <button
            onClick={() => onNavigate('check')}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer min-h-[48px]"
          >
            <span>Check a Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Score badge circle */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs flex-shrink-0 border ${
                    item.riskLevel === 'LOW'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : item.riskLevel === 'REVIEW'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <span className="text-sm sm:text-base leading-none font-extrabold">{item.score}</span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-semibold text-slate-500">score</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                      ₹{item.paymentDetails.amount.toLocaleString('en-IN')}
                    </span>
                    <StatusBadge level={item.riskLevel} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="truncate max-w-[140px] sm:max-w-xs">Payee: <strong className="text-slate-700">{item.paymentDetails.recipient}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(item.analyzedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-7 md:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <StatusBadge level={selectedItem.riskLevel} size="md" />
                <span className="text-xs font-semibold text-slate-400">Score {selectedItem.score}/100</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 break-words">
              ₹{selectedItem.paymentDetails.amount.toLocaleString('en-IN')} to {selectedItem.paymentDetails.recipient}
            </h3>
            <p className="text-xs text-slate-500 mb-5 sm:mb-6">
              Recorded on {formatDate(selectedItem.analyzedAt)}
            </p>

            {/* Context details */}
            <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm mb-5 sm:mb-6 border border-slate-200/70">
              <div className="flex justify-between">
                <span className="text-slate-500">First-time recipient:</span>
                <span className="font-semibold text-slate-900">
                  {selectedItem.paymentDetails.isFirstTime ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Urgent request:</span>
                <span className="font-semibold text-slate-900">
                  {selectedItem.paymentDetails.isUrgent ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unusual payment method:</span>
                <span className="font-semibold text-slate-900">
                  {selectedItem.paymentDetails.isUnusualMethod ? 'Yes' : 'No'}
                </span>
              </div>
              {selectedItem.paymentDetails.purpose && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-semibold text-slate-900 max-w-[180px] sm:max-w-[200px] truncate">
                    {selectedItem.paymentDetails.purpose}
                  </span>
                </div>
              )}
            </div>

            {/* Detected Factors */}
            {selectedItem.factors.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Detected Risk Factors ({selectedItem.factors.length})
                </h4>
                <div className="space-y-2">
                  {selectedItem.factors.map((f) => (
                    <div key={f.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700">
                      <div className="font-bold text-amber-900 mb-0.5">{f.title}</div>
                      <div>{f.whyItMattersText}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs mb-5 sm:mb-6">
              <span className="font-bold text-emerald-400 block mb-0.5">Recommendation:</span>
              <span>{selectedItem.recommendation}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSelectAssessment(selectedItem);
                  setSelectedItem(null);
                }}
                className="w-full py-3.5 text-center text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                Open Full Assessment View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
