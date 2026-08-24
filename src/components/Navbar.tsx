import React, { useState } from 'react';
import { NavigationPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Menu, X, ArrowRight, LogOut, User as UserIcon, FileText, ShieldAlert, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (page: NavigationPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo / Brand */}
          <button
            id="nav-brand-logo"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-lg p-1 cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
              FinGuard
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <button
              id="nav-link-home"
              onClick={() => handleNav('home')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[40px] flex items-center ${
                currentPage === 'home'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-how-it-works"
              onClick={() => handleNav('how-it-works')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[40px] flex items-center ${
                currentPage === 'how-it-works'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              How It Works
            </button>
            <button
              id="nav-link-history"
              onClick={() => handleNav('history')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[40px] flex items-center ${
                currentPage === 'history'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              History
            </button>

            {user && (
              <button
                id="nav-link-documents"
                onClick={() => handleNav('documents')}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                  currentPage === 'documents'
                    ? 'text-slate-900 bg-slate-100 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                id="nav-link-admin"
                onClick={() => handleNav('admin')}
                className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                  currentPage === 'admin'
                    ? 'text-amber-900 bg-amber-100 font-bold'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100/80'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* Desktop Right Side: Primary CTA & User Profile / Login */}
          <div className="hidden md:flex items-center gap-3">
            <button
              id="nav-cta-check-payment"
              onClick={() => handleNav('check')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-xs hover:shadow transition-all focus:outline-none cursor-pointer min-h-[40px]"
            >
              <span>Check Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs min-w-0 max-w-[120px]">
                    <div className="font-bold text-slate-900 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                      {user.role === 'admin' ? (
                        <span className="text-amber-700 font-bold">ADMIN</span>
                      ) : (
                        <span>USER</span>
                      )}
                    </div>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('documents')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>My Documents Vault</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50/50 hover:bg-amber-100/50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>Admin Risk Portal</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-btn-login"
                onClick={() => handleNav('login')}
                className="px-4 py-2 text-sm font-bold text-slate-900 border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[40px]"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="nav-mobile-menu"
          className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150"
        >
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
              currentPage === 'home' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('check')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
              currentPage === 'check' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            Check a Payment
          </button>
          <button
            onClick={() => handleNav('how-it-works')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
              currentPage === 'how-it-works' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav('history')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
              currentPage === 'history' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            History
          </button>

          {user && (
            <button
              onClick={() => handleNav('documents')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 ${
                currentPage === 'documents' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document Vault</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => handleNav('admin')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 ${
                currentPage === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Admin Compliance Portal</span>
            </button>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-900">{user.name} ({user.role.toUpperCase()})</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-xs font-bold text-rose-600 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className="w-full py-3 text-center text-sm font-bold text-slate-900 bg-slate-100 rounded-xl"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={() => handleNav('check')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-slate-900 rounded-xl shadow-sm"
            >
              <span>Check a Payment Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
