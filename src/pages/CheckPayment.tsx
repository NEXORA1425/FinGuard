import React, { useState, useRef } from 'react';
import { PaymentFormData, ExtractedDocumentData } from '../types';
import { ShieldCheck, ArrowRight, FileText, CheckCircle2, Clock, CreditCard, Sparkles, UserCheck } from 'lucide-react';
import { DocumentUploadCard } from '../components/DocumentUploadCard';
import { ExtractedDetailsReview } from '../components/ExtractedDetailsReview';

interface CheckPaymentProps {
  formData: PaymentFormData;
  setFormData: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onSubmit: () => void;
}

export const CheckPayment: React.FC<CheckPaymentProps> = ({
  formData,
  setFormData,
  onSubmit,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter a valid payment amount.';
    }
    if (!formData.recipient.trim()) {
      errs.recipient = 'Recipient or vendor name is required.';
    }
    if (formData.isFirstTime === null) {
      errs.isFirstTime = 'Please specify if you have sent money to this recipient before.';
    }
    if (formData.isUrgent === null) {
      errs.isUrgent = 'Please indicate whether this payment is urgent or time-pressured.';
    }
    if (formData.isUnusualMethod === null) {
      errs.isUnusualMethod = 'Please indicate if this payment method or channel feels unusual.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const updateField = (field: keyof PaymentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDetailsExtracted = (
    data: ExtractedDocumentData,
    fileInfo: { name: string; size: number; type: string }
  ) => {
    setExtractedData(data);
    setUploadedFileInfo(fileInfo);

    // Populate or merge form state with extracted fields
    setFormData((prev) => ({
      ...prev,
      amount: data.amount ? String(data.amount) : prev.amount,
      recipient: data.recipient || prev.recipient,
      purpose: data.purpose || prev.purpose,
      isUrgent: data.isUrgent ?? (data.urgentLanguageDetected ? true : prev.isUrgent),
      isUnusualMethod: data.isUnusualMethod ?? (data.unusualMethodDetected ? true : prev.isUnusualMethod),
    }));

    // Clear any previous validation errors for populated fields
    setErrors({});
  };

  const handleClearUploadedFile = () => {
    setExtractedData(null);
    setUploadedFileInfo(null);
  };

  const scrollToFormSection = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Top Banner */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Check a Payment
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
          Provide basic details or upload a document to identify potential risk signals.
        </p>
      </div>

      {/* 1. Document Upload Feature Section */}
      <div className="mb-6 sm:mb-8 space-y-4">
        <DocumentUploadCard
          onDetailsExtracted={handleDetailsExtracted}
          activeFileInfo={uploadedFileInfo}
          onClearFile={handleClearUploadedFile}
          onSwitchToManual={scrollToFormSection}
        />

        {/* Extracted Details Confirmation & Review UI */}
        {extractedData && (
          <ExtractedDetailsReview
            extractedData={extractedData}
            formData={formData}
            onUpdateField={updateField}
            fileName={uploadedFileInfo?.name}
          />
        )}
      </div>

      {/* Visual Separator if document is not yet uploaded */}
      {!extractedData && (
        <div className="flex items-center gap-3 my-6 sm:my-8 text-xs uppercase font-bold tracking-wider text-slate-400">
          <div className="h-px bg-slate-200 flex-1" />
          <span>Or Enter Details Manually</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      )}

      {/* 2. Manual Payment Form Card */}
      <div
        ref={formSectionRef}
        id="manual-payment-form-card"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4.5 sm:p-7 md:p-9 shadow-xs"
      >
        <div className="mb-5 sm:mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Payment Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Please fill in the payment details below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Amount Field */}
          <div>
            <label
              htmlFor="input-amount"
              className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
            >
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500 font-bold text-base sm:text-lg">
                ₹
              </div>
              <input
                type="number"
                id="input-amount"
                min="1"
                step="any"
                placeholder="e.g. 5000"
                value={formData.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-4 py-3 sm:py-3.5 rounded-xl border text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-colors min-h-[48px] ${
                  errors.amount
                    ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-slate-900 bg-white hover:border-slate-400'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* Recipient Field */}
          <div>
            <label
              htmlFor="input-recipient"
              className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
            >
              Recipient / Payee Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-recipient"
              placeholder="e.g. Acme Tech Solutions / rahul.kumar@upi"
              value={formData.recipient}
              onChange={(e) => updateField('recipient', e.target.value)}
              className={`w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl border text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-colors min-h-[48px] ${
                errors.recipient
                  ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-slate-900 bg-white hover:border-slate-400'
              }`}
            />
            {errors.recipient && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.recipient}</p>
            )}
          </div>

          {/* Purpose / Note */}
          <div>
            <label
              htmlFor="input-purpose"
              className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
            >
              Payment Purpose <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="input-purpose"
              placeholder="e.g. Freelance invoice, security deposit, emergency refund"
              value={formData.purpose}
              onChange={(e) => updateField('purpose', e.target.value)}
              className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white hover:border-slate-400 transition-colors min-h-[44px]"
            />
          </div>

          {/* 3 Safety Signal Toggles */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* 1. First time sending money? */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                Have you sent money to this recipient before? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  id="btn-first-time-no"
                  onClick={() => updateField('isFirstTime', false)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isFirstTime === false
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>Yes, I have sent money before</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isFirstTime === false ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isFirstTime === false && '✓'}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-first-time-yes"
                  onClick={() => updateField('isFirstTime', true)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isFirstTime === true
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>No, this is a first-time recipient</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isFirstTime === true ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isFirstTime === true && '✓'}
                  </span>
                </button>
              </div>
              {errors.isFirstTime && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.isFirstTime}</p>
              )}
            </div>

            {/* 2. Urgent / Pressured? */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                Is there unusual urgency or pressure to pay right now? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  id="btn-urgent-no"
                  onClick={() => updateField('isUrgent', false)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isUrgent === false
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>No, standard / normal timeline</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isUrgent === false ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isUrgent === false && '✓'}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-urgent-yes"
                  onClick={() => updateField('isUrgent', true)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isUrgent === true
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>Yes, urgent or immediate rush</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isUrgent === true ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isUrgent === true && '✓'}
                  </span>
                </button>
              </div>
              {errors.isUrgent && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.isUrgent}</p>
              )}
            </div>

            {/* 3. Unusual Method / Request Channel? */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                Did the payment request come via an unusual channel or request an uncommon payment method? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  id="btn-unusual-method-no"
                  onClick={() => updateField('isUnusualMethod', false)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isUnusualMethod === false
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>No, familiar and standard method</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isUnusualMethod === false ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isUnusualMethod === false && '✓'}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-unusual-method-yes"
                  onClick={() => updateField('isUnusualMethod', true)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between cursor-pointer min-h-[48px] ${
                    formData.isUnusualMethod === true
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>Yes, unusual channel or method</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    formData.isUnusualMethod === true ? 'border-white text-white' : 'border-slate-300'
                  }`}>
                    {formData.isUnusualMethod === true && '✓'}
                  </span>
                </button>
              </div>
              {errors.isUnusualMethod && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.isUnusualMethod}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4">
            <button
              type="submit"
              id="btn-submit-check"
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 cursor-pointer min-h-[50px]"
            >
              <span>Review Payment Safety</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Safety Notice */}
      <div className="mt-6 text-center text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
        <p>
          FinGuard is a decision-support tool. It does not process payments, verify account balances, or connect to bank servers.
        </p>
      </div>
    </div>
  );
};
