import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, HelpCircle, Lock, Calculator, AlertCircle, FileSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface FAQItem {
  id: string;
  category: 'privacy' | 'scoring' | 'usage' | 'security';
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'data-privacy',
    category: 'privacy',
    question: 'Does FinGuard store my financial data or bank credentials?',
    answer:
      'No. FinGuard never asks for, accesses, or stores your bank login credentials, UPI PINs, CVVs, passwords, or OTPs. All safety checks run client-side in your browser, and past assessment histories are stored exclusively in your local device storage.',
  },
  {
    id: 'risk-calculation',
    category: 'scoring',
    question: 'How is the risk score calculated?',
    answer:
      'Every assessment begins at a maximum safety score of 100 (Safe). The safety engine analyzes multiple risk factors: unfamiliar or first-time recipients (-25 pts), artificial urgency or pressure tactics (-25 pts), unusual payment methods like gift cards or remote apps (-30 pts), and high transfer amounts without prior history (-10 pts).',
  },
  {
    id: 'block-transfer',
    category: 'usage',
    question: 'Can FinGuard stop or block my bank transfer?',
    answer:
      'No. FinGuard is a pre-transaction decision support tool, not a payment gateway or banking intermediary. It does not hold funds or intervene in bank settlement channels. You always remain in complete control of authorizing transactions in your preferred banking or UPI app.',
  },
  {
    id: 'high-risk-action',
    category: 'security',
    question: 'What should I do if a payment is flagged as High Risk?',
    answer:
      'Pause immediately and do not send money. Independently verify the recipient by calling them on a known, trusted phone number (never use the contact number provided in the urgent message or suspicious bill). Review our structured Safety Pause checklist before taking any further action.',
  },
  {
    id: 'document-extraction',
    category: 'usage',
    question: 'How does document and invoice extraction work?',
    answer:
      'When you upload an invoice, bill, or payment request screenshot, FinGuard securely parses key metadata such as the requested amount, payee details, payment instructions, and any urgent language. This information is pre-filled into your review form so you can inspect it with full clarity.',
  },
  {
    id: 'export-records',
    category: 'privacy',
    question: 'Can I print or share my safety report with a financial advisor or family member?',
    answer:
      'Yes. On the Assessment Result page, you can click "Share Summary" to copy a concise breakdown to your clipboard, or click "Print / Save PDF" to generate an official, printer-friendly PDF record for your personal archives.',
  },
];

interface FAQAccordionProps {
  items?: FAQItem[];
  defaultOpenId?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items = DEFAULT_FAQ_ITEMS,
  defaultOpenId = 'data-privacy',
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'privacy', label: 'Data & Privacy' },
    { id: 'scoring', label: 'Score Calculation' },
    { id: 'security', label: 'Safety & Actions' },
  ];

  return (
    <div className="w-full" id="faq-accordion-container">
      {/* Category Filter Pills */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-6 no-print">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`faq-cat-${cat.id}`}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion Item Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              id={`faq-accordion-${item.id}`}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-slate-300 shadow-xs ring-1 ring-slate-200/80'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-body-${item.id}`}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3.5 cursor-pointer select-none focus:outline-none focus:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5 sm:mt-0">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-snug">
                    {item.question}
                  </span>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-body-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-accordion-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 sm:pl-15 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
