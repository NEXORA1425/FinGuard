import React from 'react';
import { NavigationPage } from '../types';
import {
  ArrowRight,
  PauseCircle,
  Search,
  HelpCircle,
  CheckCircle2,
  FileText,
  Lock,
  ShieldQuestion,
} from 'lucide-react';
import { FAQAccordion } from '../components/FAQAccordion';

interface HowItWorksProps {
  onNavigate: (page: NavigationPage) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {

  const steps = [
    {
      num: '01',
      title: 'Enter details',
      subtitle: 'Provide basic context about the payment you want to make.',
      description:
        'Enter the amount, recipient, whether you have sent funds before, urgency, and method. No banking passwords or login details are ever requested.',
      icon: <FileText className="w-5 h-5 text-slate-700" />,
    },
    {
      num: '02',
      title: 'Check signals',
      subtitle: 'FinGuard looks for potential risk signals.',
      description:
        'The safety engine checks for common warning signals, including pressure tactics, unfamiliar payees, and atypical transfer channels.',
      icon: <Search className="w-5 h-5 text-slate-700" />,
    },
    {
      num: '03',
      title: 'Understand context',
      subtitle: 'You see what was detected and why it matters.',
      description:
        'Clear, plain-language explanations break down any detected risk factors so you understand the potential concern before proceeding.',
      icon: <HelpCircle className="w-5 h-5 text-slate-700" />,
    },
    {
      num: '04',
      title: 'Safety pause',
      subtitle: 'Review a concise safety checklist.',
      description:
        'A focused checklist helps you verify key details independently before authorizing any transfer in your payment app.',
      icon: <PauseCircle className="w-5 h-5 text-slate-700" />,
    },
    {
      num: '05',
      title: 'Decide with confidence',
      subtitle: 'You remain in complete control of your money.',
      description:
        'FinGuard provides decision support. You complete the transaction through your preferred banking or payment app.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 md:py-16">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          How FinGuard Works
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-2 leading-relaxed">
          A dedicated pre-transaction safety layer designed to protect digital financial decisions.
        </p>
      </div>

      {/* Core Philosophy Callout Card */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-12 shadow-sm text-center">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block mb-2">
          Product Philosophy
        </span>
        <blockquote className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight max-w-xl mx-auto text-slate-100 leading-snug">
          “FinGuard doesn’t decide for you. It makes the decision safer.”
        </blockquote>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
          Traditional security verifies device credentials. FinGuard helps verify the context behind the payment before you send money.
        </p>
      </div>

      {/* 5 Steps Sequence */}
      <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-14">
        {steps.map((s) => (
          <div
            key={s.num}
            id={`step-card-${s.num}`}
            className="bg-white rounded-2xl border border-slate-200/90 p-4.5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start gap-3.5 sm:gap-6"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400">{s.num}</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{s.title}</h3>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                {s.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Boundary Statement */}
      <div className="bg-slate-100 rounded-2xl p-5 sm:p-6 border border-slate-200/90 mb-10 sm:mb-14">
        <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-700" />
          <span>What FinGuard Is — and Is Not</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-200">
          <div>
            <span className="font-bold text-slate-900 block mb-1">What FinGuard does:</span>
            <ul className="space-y-1 list-disc list-inside">
              <li>Provides pre-payment risk evaluations</li>
              <li>Highlights potential warning signals</li>
              <li>Guides structured verification checks</li>
              <li>Saves local, private session history</li>
            </ul>
          </div>
          <div>
            <span className="font-bold text-slate-900 block mb-1">What FinGuard does NOT do:</span>
            <ul className="space-y-1 list-disc list-inside">
              <li>Does not process or hold money</li>
              <li>Does not request bank credentials or OTPs</li>
              <li>Does not guarantee total fraud immunity</li>
              <li>Does not block transactions unilaterally</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-10 sm:mb-14" id="faq-section">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-2">
            <ShieldQuestion className="w-3.5 h-3.5 text-slate-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Common Questions & Answers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Learn more about FinGuard's security model, privacy commitments, and risk scoring.
          </p>
        </div>

        {/* Clean Accessible Accordion Component */}
        <FAQAccordion />
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <button
          onClick={() => onNavigate('check')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 cursor-pointer min-h-[48px]"
        >
          <span>Check a Payment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

