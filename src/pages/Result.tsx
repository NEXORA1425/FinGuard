import React, { useState } from 'react';
import { SafetyAssessment } from '../types';
import { RiskScore } from '../components/RiskScore';
import { StatusBadge } from '../components/StatusBadge';
import { RiskFactorCard } from '../components/RiskFactorCard';
import {
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Info,
  Printer,
  Share2,
  Check,
  Copy,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResultProps {
  assessment: SafetyAssessment;
  onReviewChecklist: () => void;
  onStartOver: () => void;
}

export const Result: React.FC<ResultProps> = ({
  assessment,
  onReviewChecklist,
  onStartOver,
}) => {
  const { score, riskLevel, factors, recommendation, paymentDetails, analyzedAt } = assessment;
  const [copied, setCopied] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Generate plain-text shareable summary for clipboard/advisor
  const generateShareText = () => {
    const formattedAmount = `₹${paymentDetails.amount.toLocaleString('en-IN')}`;
    const riskLabel =
      riskLevel === 'LOW'
        ? 'Low Risk (Safe)'
        : riskLevel === 'REVIEW'
        ? 'Review Needed (Caution)'
        : 'High Risk (Warning)';

    const detectedFactorsText =
      factors.length > 0
        ? factors.map((f, i) => `  ${i + 1}. ${f.title}: ${f.detectedText}`).join('\n')
        : '  • No critical warning signals detected.';

    return `🛡️ FinGuard Safety Assessment Report
----------------------------------------
Payment Details:
• Amount: ${formattedAmount}
• Recipient: ${paymentDetails.recipient}
• Purpose: ${paymentDetails.purpose || 'Not specified'}
• First-Time Payee: ${paymentDetails.isFirstTime ? 'Yes' : 'No'}
• Urgency Flagged: ${paymentDetails.isUrgent ? 'Yes' : 'No'}
• Unverified Method: ${paymentDetails.isUnusualMethod ? 'Yes' : 'No'}

Safety Analysis:
• Score: ${score}/100
• Risk Rating: ${riskLabel}
• Recommendation: ${recommendation}

Identified Signals:
${detectedFactorsText}

Date: ${new Date(analyzedAt).toLocaleString('en-IN')}
Generated via FinGuard - Financial Decision Support`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `FinGuard Safety Assessment for ₹${paymentDetails.amount.toLocaleString('en-IN')}`,
          text: shareText,
        });
        setShareStatus('Shared successfully');
        setTimeout(() => setShareStatus(null), 3000);
        return;
      } catch (err) {
        // Fallback to clipboard if share was cancelled or failed
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setShareStatus('Summary copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShareStatus(null);
      }, 3000);
    } catch {
      setShareStatus('Unable to access clipboard');
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(analyzedAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Print-Only Header (Hidden on screen, visible when printing or saving as PDF) */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">FinGuard Safety Assessment Report</h1>
            <p className="text-xs text-slate-500">Official Pre-Transaction Decision Record</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Date: {formattedDate}</div>
            <div>Ref ID: {assessment.id}</div>
          </div>
        </div>
      </div>

      {/* Screen Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-6 sm:mb-8"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Assessed on {formattedDate}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Safety Assessment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 break-words max-w-lg mx-auto leading-relaxed">
          Payment review for ₹{paymentDetails.amount.toLocaleString('en-IN')} to{' '}
          <strong className="text-slate-900">{paymentDetails.recipient}</strong>
        </p>

        {/* Quick Utility Actions Bar: Share & Print */}
        <div className="flex items-center justify-center gap-2.5 mt-3.5 no-print">
          <button
            id="btn-share-summary"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer min-h-[38px]"
            title="Share summary with trusted advisor"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share Summary</span>
              </>
            )}
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer min-h-[38px]"
            title="Print report or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Toast alert for copy action */}
        <AnimatePresence>
          {shareStatus && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2.5 inline-block text-xs font-semibold px-3 py-1 rounded-lg bg-slate-900 text-white shadow-md"
            >
              {shareStatus}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Score & Risk Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4.5 sm:p-7 md:p-8 shadow-sm mb-6 sm:mb-8 risk-card"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 pb-6 sm:pb-7 border-b border-slate-100">
          {/* Prominent Score Gauge with Motion */}
          <div className="w-full md:w-auto flex justify-center flex-shrink-0">
            <RiskScore score={score} level={riskLevel} />
          </div>

          {/* Risk Level & Context */}
          <div className="flex-1 text-center md:text-left space-y-3.5 sm:space-y-4 w-full">
            <div>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Current Risk Level
              </span>
              <StatusBadge level={riskLevel} size="lg" />
            </div>

            {/* 3-Tier Risk Indicator Spectrum */}
            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-left">
                Safety Scale
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 text-center">
                {/* Low Risk */}
                <div
                  className={`p-2.5 rounded-xl border transition-all text-left flex sm:flex-col justify-between items-center sm:items-start ${
                    riskLevel === 'LOW'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/25 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-500 opacity-65 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0 sm:mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-bold">LOW RISK</span>
                  </div>
                  <span className="text-[11px] text-slate-500">75–100</span>
                </div>

                {/* Review */}
                <div
                  className={`p-2.5 rounded-xl border transition-all text-left flex sm:flex-col justify-between items-center sm:items-start ${
                    riskLevel === 'REVIEW'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/25 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-500 opacity-65 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0 sm:mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs font-bold">REVIEW BEFORE PAYING</span>
                  </div>
                  <span className="text-[11px] text-slate-500">45–74</span>
                </div>

                {/* High Risk */}
                <div
                  className={`p-2.5 rounded-xl border transition-all text-left flex sm:flex-col justify-between items-center sm:items-start ${
                    riskLevel === 'HIGH'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/25 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-500 opacity-65 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0 sm:mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-xs font-bold">HIGH RISK</span>
                  </div>
                  <span className="text-[11px] text-slate-500">0–44</span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">
              {riskLevel === 'HIGH'
                ? 'We noticed multiple warning signs with this payment request. We strongly encourage you to pause and independently check with the recipient before sending any money.'
                : riskLevel === 'REVIEW'
                ? 'A couple of details about this payment warrant a closer look. Take a quick moment to review the safety checklist before you authorize the transfer.'
                : 'Everything looks standard based on what you shared. Still, always verify recipient details before sending money.'}
            </p>

            {/* Payment Details Metadata Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payee:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{paymentDetails.recipient}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-slate-900">₹{paymentDetails.amount.toLocaleString('en-IN')}</span>
              </div>
              {paymentDetails.purpose && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{paymentDetails.purpose}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 sm:gap-3.5">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Recommended action
            </h3>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 leading-snug">
              {recommendation}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Why we're warning you (Detected Factors) */}
      <div className="mb-6 sm:mb-8" id="risk-factor-container">
        <div className="mb-3.5 sm:mb-4">
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            {factors.length > 0 ? "Why we're warning you" : 'Safety Assessment Summary'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {factors.length > 0
              ? 'Here is what contributed to this assessment and why you should pay attention:'
              : 'Summary of signals evaluated for this payment.'}
          </p>
        </div>

        {factors.length > 0 ? (
          <div className="space-y-3 sm:space-y-3.5">
            {factors.map((factor, index) => (
              <RiskFactorCard key={factor.id} factor={factor} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 text-center"
          >
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">No warning signals found</h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Based on the information provided, no elevated risk factors were identified. Always double-check recipient details before confirming.
            </p>
          </motion.div>
        )}
      </div>

      {/* Primary & Secondary Actions (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 mb-6 sm:mb-8 no-print">
        <button
          id="btn-review-checklist"
          onClick={onReviewChecklist}
          className="w-full sm:flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-xl text-sm sm:text-base font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 cursor-pointer min-h-[48px]"
        >
          <span>Review Safety Checklist</span>
          <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>

        <button
          id="btn-start-over"
          onClick={onStartOver}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 sm:py-4 px-5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Check Another Payment</span>
        </button>
      </div>

      {/* Safety Note & Print Footer */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-100/80 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">Safety note:</strong> FinGuard provides decision support based on the information entered. It does not move funds, access banking accounts, or guarantee total fraud immunity.
        </p>
      </div>
    </div>
  );
};

