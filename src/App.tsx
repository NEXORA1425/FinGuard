import React, { useState, useEffect } from 'react';
import {
  NavigationPage,
  PaymentFormData,
  SafetyAssessment,
} from './types';
import { calculateSafetyAssessment } from './services/riskEngine';
import { INITIAL_MOCK_HISTORY, DEMO_PRESETS } from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { CheckPayment } from './pages/CheckPayment';
import { Analysis } from './pages/Analysis';
import { Result } from './pages/Result';
import { SafetyPause } from './pages/SafetyPause';
import { History } from './pages/History';
import { HowItWorks } from './pages/HowItWorks';
import { AuthPage } from './pages/AuthPage';
import { UserDocuments } from './pages/UserDocuments';
import { AdminDashboard } from './pages/AdminDashboard';
import { ShieldCheck, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'finguard_safety_history_v1';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<NavigationPage>('home');

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    recipient: '',
    isFirstTime: null,
    isUrgent: null,
    purpose: '',
    isUnusualMethod: null,
  });

  const [currentAssessment, setCurrentAssessment] = useState<SafetyAssessment | null>(null);

  // History state: syncs with backend or localStorage fallback
  const [history, setHistory] = useState<SafetyAssessment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
    }
    return INITIAL_MOCK_HISTORY;
  });

  // Sync history from backend whenever user logs in
  useEffect(() => {
    async function loadBackendHistory() {
      const token = localStorage.getItem('finguard_auth_token_v1');
      if (!token) return;

      try {
        const res = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.history && Array.isArray(data.history) && data.history.length > 0) {
            setHistory(data.history);
          }
        }
      } catch (e) {
        console.warn('Backend history sync error', e);
      }
    }
    if (user) {
      loadBackendHistory();
    }
  }, [user]);

  // Sync history to localStorage fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist history to localStorage', e);
    }
  }, [history]);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Protected Routes & Router navigation handler
  const navigateTo = (page: NavigationPage) => {
    // Protected pages requiring authentication (Users MUST sign up/log in before checking a payment)
    const protectedPages: NavigationPage[] = ['check', 'documents', 'history', 'admin'];

    if (protectedPages.includes(page) && !user) {
      setRedirectAfterLogin(page);
      setCurrentPage('login');
      return;
    }

    // Role-based protection: Admin page requires admin role
    if (page === 'admin' && user && user.role !== 'admin') {
      setCurrentPage('admin'); // Admin Dashboard renders Access Denied view
      return;
    }

    setCurrentPage(page);
  };

  // Flow Step 1 -> Step 2: Form submit -> Analysis
  const handleFormSubmit = () => {
    const assessment = calculateSafetyAssessment(formData);
    setCurrentAssessment(assessment);
    setCurrentPage('analysis');
  };

  // Flow Step 2 -> Step 3: Analysis complete -> Result
  const handleAnalysisComplete = () => {
    setCurrentPage('result');
  };

  // Flow Step 3 -> Step 4: Result -> Safety Pause Checklist
  const handleReviewChecklist = () => {
    setCurrentPage('pause');
  };

  // Flow Step 4: Safety Pause complete -> Save to history & Acknowledged
  const handleDecisionAcknowledged = () => {
    if (currentAssessment) {
      const updatedAssessment: SafetyAssessment = {
        ...currentAssessment,
        decisionStatus: 'acknowledged',
      };
      setCurrentAssessment(updatedAssessment);

      // Save to local history state
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== updatedAssessment.id);
        return [updatedAssessment, ...filtered];
      });

      // Save to backend history if logged in
      const token = localStorage.getItem('finguard_auth_token_v1');
      if (token) {
        fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assessment: updatedAssessment }),
        }).catch((err) => console.warn('Failed to save assessment to backend', err));
      }
    }
  };

  // Start Over / Reset Form
  const handleStartOver = () => {
    setFormData({
      amount: '',
      recipient: '',
      isFirstTime: null,
      isUrgent: null,
      purpose: '',
      isUnusualMethod: null,
    });
    setCurrentAssessment(null);
    setCurrentPage('check');
  };

  // Clear History
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage', e);
    }
  };

  // Select Assessment from History
  const handleSelectFromHistory = (item: SafetyAssessment) => {
    setCurrentAssessment(item);
    setCurrentPage('result');
  };

  // Authentication State Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-3" />
        <h2 className="text-base font-bold text-slate-200">Verifying FinGuard Security Session...</h2>
        <p className="text-xs text-slate-500 mt-1">Initializing persistent session & authorization keys</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Universal Navigation */}
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />

      {/* Main Page Router */}
      <main className="flex-1 flex flex-col">
        {currentPage === 'home' && (
          <Home
            onNavigate={navigateTo}
            onQuickPresetSelect={(idx) => {
              const preset = DEMO_PRESETS[idx];
              if (preset) {
                setFormData({ ...preset.data });
                navigateTo('check');
              }
            }}
          />
        )}

        {currentPage === 'check' && (
          <CheckPayment
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
          />
        )}

        {currentPage === 'analysis' && (
          <Analysis onComplete={handleAnalysisComplete} />
        )}

        {currentPage === 'result' && currentAssessment && (
          <Result
            assessment={currentAssessment}
            onReviewChecklist={handleReviewChecklist}
            onStartOver={handleStartOver}
          />
        )}

        {currentPage === 'pause' && currentAssessment && (
          <SafetyPause
            assessment={currentAssessment}
            onGoBack={() => setCurrentPage('result')}
            onDecisionAcknowledged={handleDecisionAcknowledged}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'history' && (
          <History
            history={history}
            onClearHistory={handleClearHistory}
            onSelectAssessment={handleSelectFromHistory}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'how-it-works' && (
          <HowItWorks onNavigate={navigateTo} />
        )}

        {currentPage === 'login' && (
          <AuthPage
            onNavigate={navigateTo}
            redirectAfterLogin={redirectAfterLogin}
          />
        )}

        {currentPage === 'documents' && (
          <UserDocuments onNavigate={navigateTo} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard onNavigate={navigateTo} />
        )}
      </main>

      {/* Trust & Compliance Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
