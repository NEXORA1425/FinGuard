import React from 'react';
import { RiskFactor } from '../types';
import { AlertTriangle, Clock, ShieldAlert, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface RiskFactorCardProps {
  factor: RiskFactor;
  index?: number;
}

export const RiskFactorCard: React.FC<RiskFactorCardProps> = ({ factor, index = 0 }) => {
  const getIcon = () => {
    switch (factor.iconType) {
      case 'clock':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'channel':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'amount':
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const isHighSeverity = factor.severity === 'high';

  return (
    <motion.div
      id={`risk-factor-${factor.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className={`rounded-2xl border p-5 sm:p-6 transition-all bg-white shadow-2xs risk-card ${
        isHighSeverity
          ? 'border-rose-200/90'
          : 'border-amber-200/90'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isHighSeverity
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {factor.title}
            </h4>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isHighSeverity
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isHighSeverity ? 'High risk factor' : 'Caution factor'}
            </span>
          </div>

          {/* What was detected */}
          <div className="mt-3 text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed">
            <span className="font-bold text-slate-900 mr-1.5">What was detected:</span>
            <span>{factor.detectedText}</span>
          </div>

          {/* Why it matters */}
          <div className="mt-2.5 text-sm text-slate-600 leading-relaxed pl-0.5">
            <span className="font-bold text-slate-800 mr-1.5">Why it matters:</span>
            <span>{factor.whyItMattersText}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

