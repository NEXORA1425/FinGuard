import React, { useState } from 'react';
import { ExtractedDocumentData, PaymentFormData } from '../types';
import {
  CheckCircle2,
  FileText,
  Clock,
  CreditCard,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExtractedDetailsReviewProps {
  extractedData: ExtractedDocumentData;
  formData: PaymentFormData;
  onUpdateField: (field: keyof PaymentFormData, value: any) => void;
  fileName?: string;
}

export const ExtractedDetailsReview: React.FC<ExtractedDetailsReviewProps> = ({
  extractedData,
  formData,
  onUpdateField,
  fileName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      id="extracted-details-review-component"
      className="bg-white rounded-2xl border-2 border-slate-900/10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-6">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base md:text-lg text-white truncate">
                Review Extracted Details
              </h3>
              <p className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
                {fileName
                  ? `Identified from ${fileName}`
                  : 'Identified from your uploaded document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              id="btn-toggle-extracted-edit"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer min-h-[38px]"
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Details</span>
                </>
              )}
            </button>
            <button
              type="button"
              id="btn-toggle-extracted-expand"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-label={isExpanded ? 'Collapse extracted details' : 'Expand extracted details'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* AI Explanation Text */}
        {extractedData.explanation && isExpanded && (
          <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 break-words">
            <strong className="text-slate-200">Document Summary: </strong>
            {extractedData.explanation}
          </p>
        )}
      </div>

      {/* Extracted Details Grid & Potential Signals */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Key Extracted Values Display / Quick Inline Edit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Amount */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Extracted Amount
              </span>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-600 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      onUpdateField(
                        'amount',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              ) : (
                <p className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                  ₹{Number(formData.amount || 0).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Recipient */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Recipient / Vendor
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => onUpdateField('recipient', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              ) : (
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {formData.recipient || 'Not specified'}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Payment Purpose
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => onUpdateField('purpose', e.target.value)}
                  placeholder="e.g. Invoice payment"
                  className="w-full px-2.5 py-1.5 text-sm font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              ) : (
                <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                  {formData.purpose || 'Not specified in document'}
                </p>
              )}
            </div>

            {/* First Time Recipient */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                First Time Payment?
              </span>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateField('isFirstTime', true)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold min-h-[36px] flex-1 ${
                      formData.isFirstTime === true
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateField('isFirstTime', false)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold min-h-[36px] flex-1 ${
                      formData.isFirstTime === false
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {formData.isFirstTime === true
                    ? 'Yes (New recipient)'
                    : formData.isFirstTime === false
                    ? 'No (Sent before)'
                    : 'Unconfirmed (Please select below)'}
                </p>
              )}
            </div>
          </div>

          {/* Extracted Warning / Context Signals */}
          {(extractedData.urgentLanguageDetected ||
            extractedData.unusualMethodDetected ||
            extractedData.paymentInstructions) && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Extracted Context & Instructions
              </span>

              {extractedData.urgentLanguageDetected && (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="break-words min-w-0">
                    <span className="font-bold">Urgent phrasing noted: </span>
                    <span>"{extractedData.urgentLanguageDetected}"</span>
                  </div>
                </div>
              )}

              {extractedData.unusualMethodDetected && (
                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                  <CreditCard className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="break-words min-w-0">
                    <span className="font-bold">Unusual channel detected: </span>
                    <span>"{extractedData.unusualMethodDetected}"</span>
                  </div>
                </div>
              )}

              {extractedData.paymentInstructions && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="break-words min-w-0">
                    <span className="font-bold text-slate-900">
                      Payment instructions on document:{' '}
                    </span>
                    <span className="text-slate-700">
                      {extractedData.paymentInstructions}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
