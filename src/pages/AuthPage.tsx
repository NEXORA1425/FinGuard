import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, NavigationPage } from '../types';
import { ShieldCheck, UserCheck, ShieldAlert, ArrowRight, KeyRound, Mail, User as UserIcon, Lock, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: NavigationPage) => void;
  redirectAfterLogin?: NavigationPage;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, redirectAfterLogin = 'home' }) => {
  const { login, signup, error, clearError, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let success = false;
    if (mode === 'login') {
      success = await login(email, password);
    } else {
      if (!name.trim()) {
        alert('Please enter your full name.');
        return;
      }
      success = await signup(email, password, name, role);
    }

    if (success) {
      if (role === 'admin' || (mode === 'login' && email.includes('admin'))) {
        onNavigate('admin');
      } else {
        onNavigate(redirectAfterLogin);
      }
    }
  };

  const handleDemoUserLogin = async () => {
    clearError();
    setEmail('user@finguard.com');
    setPassword('User123!');
    const ok = await login('user@finguard.com', 'User123!');
    if (ok) onNavigate(redirectAfterLogin);
  };

  const handleDemoAdminLogin = async () => {
    clearError();
    setEmail('admin@finguard.com');
    setPassword('Admin123!');
    const ok = await login('admin@finguard.com', 'Admin123!');
    if (ok) onNavigate('admin');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 my-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          {redirectAfterLogin === 'check' && (
            <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Please sign in or register to check a payment</span>
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access your saved payments, documents, and risk reports.'
              : 'Join FinGuard decision safety system with persistent security.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              clearError();
            }}
            className={`py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearError();
            }}
            className={`py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    role === 'user'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>Regular User</span>
                  <span className={`text-[10px] font-normal ${role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Standard payment evaluations & private vault
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    role === 'admin'
                      ? 'border-amber-600 bg-slate-900 text-white ring-2 ring-amber-500/40'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>Admin Officer</span>
                    <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] rounded font-bold">PRO</span>
                  </span>
                  <span className={`text-[10px] font-normal ${role === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Audit logs, global metrics & compliance rules
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Presets for Demo / Evaluator convenience */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hackathon Quick Demo Presets</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleDemoUserLogin}
              className="py-2.5 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl font-semibold text-slate-800 text-center transition-colors cursor-pointer flex flex-col items-center"
            >
              <span>User Demo</span>
              <span className="text-[10px] text-slate-500">user@finguard.com</span>
            </button>
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="py-2.5 px-3 border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 rounded-xl font-semibold text-amber-900 text-center transition-colors cursor-pointer flex flex-col items-center"
            >
              <span>Admin Demo</span>
              <span className="text-[10px] text-amber-700">admin@finguard.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
