import React from 'react';
import { RiskLevel } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getStyles = () => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: (
            <ShieldCheck
              className={
                size === 'lg'
                  ? 'w-5 h-5 text-emerald-600'
                  : size === 'sm'
                  ? 'w-3.5 h-3.5 text-emerald-600'
                  : 'w-4 h-4 text-emerald-600'
              }
            />
          ),
          label: 'LOW RISK',
        };
      case 'REVIEW':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: (
            <AlertTriangle
              className={
                size === 'lg'
                  ? 'w-5 h-5 text-amber-600'
                  : size === 'sm'
                  ? 'w-3.5 h-3.5 text-amber-600'
                  : 'w-4 h-4 text-amber-600'
              }
            />
          ),
          label: 'REVIEW BEFORE PAYING',
        };
      case 'HIGH':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300',
          icon: (
            <AlertOctagon
              className={
                size === 'lg'
                  ? 'w-5 h-5 text-rose-600'
                  : size === 'sm'
                  ? 'w-3.5 h-3.5 text-rose-600'
                  : 'w-4 h-4 text-rose-600'
              }
            />
          ),
          label: 'HIGH RISK',
        };
    }
  };

  const current = getStyles();

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs sm:text-sm px-3.5 py-1 gap-2 font-bold',
    lg: 'text-sm sm:text-base px-4 py-1.5 gap-2.5 font-bold tracking-wide',
  };

  return (
    <span
      id={`status-badge-${level.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border shadow-2xs transition-colors ${current.bg} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
