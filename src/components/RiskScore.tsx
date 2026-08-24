import React from 'react';
import { RiskLevel } from '../types';
import { motion } from 'motion/react';

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
  size?: 'md' | 'lg';
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, level }) => {
  // Score is 0-100 where 100 is Safest, 0 is most hazardous
  const radius = 68;
  const strokeWidth = 11;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Arc span of 270 degrees (3/4 circle)
  const arcLength = circumference * 0.75;
  const targetOffset = arcLength - (score / 100) * arcLength;

  const getColorConfig = () => {
    switch (level) {
      case 'LOW':
        return {
          stroke: '#059669', // Emerald 600
          textClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50/50',
          badgeText: 'Low Risk',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
      case 'REVIEW':
        return {
          stroke: '#d97706', // Amber 600
          textClass: 'text-amber-700',
          bgClass: 'bg-amber-50/50',
          badgeText: 'Review Needed',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
        };
      case 'HIGH':
        return {
          stroke: '#e11d48', // Rose 600
          textClass: 'text-rose-700',
          bgClass: 'bg-rose-50/50',
          badgeText: 'High Risk',
          badgeClass: 'bg-rose-50 text-rose-900 border-rose-300',
        };
    }
  };

  const config = getColorConfig();

  return (
    <motion.div
      id="risk-score-container"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs w-full max-w-[280px] sm:max-w-xs"
    >
      <div className="relative flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56">
        <svg
          className="w-full h-full transform -rotate-135"
          viewBox="0 0 152 152"
          aria-label={`Safety score ${score} out of 100`}
        >
          {/* Background Track */}
          <circle
            cx="76"
            cy="76"
            r={normalizedRadius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Score Arc with Motion */}
          <motion.circle
            cx="76"
            cy="76"
            r={normalizedRadius}
            fill="transparent"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-2"
        >
          <span className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-0.5 sm:mb-1">
            Safety Score
          </span>
          <div className="flex items-baseline justify-center">
            <span className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tight ${config.textClass}`}>
              {score}
            </span>
            <span className="text-sm sm:text-base md:text-lg font-bold text-slate-400 ml-1">
              / 100
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold">
            0 = High Risk · 100 = Safe
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

