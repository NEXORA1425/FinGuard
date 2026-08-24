import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuditLog, StoredDocument, NavigationPage } from '../types';
import { fetchUserDocumentsApi } from '../services/documentService';
import { ShieldCheck, ShieldAlert, Users, FileText, AlertTriangle, Activity, Lock, ArrowRight, Download, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: NavigationPage) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    totalDocuments: 0,
    totalEvaluations: 0,
    highRiskCount: 0,
    reviewCount: 0,
    lowRiskCount: 0,
  });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [globalDocs, setGlobalDocs] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'docs'>('metrics');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('finguard_auth_token_v1');
    try {
      // Fetch Metrics
      const resMetrics = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        if (data.metrics) setMetrics(data.metrics);
      }

      // Fetch Audit Logs
      const resLogs = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resLogs.ok) {
        const data = await resLogs.json();
        if (data.logs) setLogs(data.logs);
      }

      // Fetch Global Documents
      const docs = await fetchUserDocumentsApi();
      setGlobalDocs(docs);
    } catch (err) {
      console.warn('Failed to load admin compliance data', err);
    } finally {
      setLoading(false);
    }
  };

  // Protected Role Guard check
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-rose-950 mb-2">
            Access Restricted (Role Protected)
          </h2>
          <p className="text-xs text-rose-800 leading-relaxed mb-6">
            The Risk Compliance Portal is restricted to administrators and compliance officers. You are currently logged in as a <strong>Regular User</strong>.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Risk & Compliance Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>ADMIN ROLE</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            System-wide audit trail, risk evaluations monitoring, and compliance statistics.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'metrics'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Risk Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'logs'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'docs'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Global Documents Vault ({globalDocs.length})
        </button>
      </div>

      {/* Tab 1: Risk Overview & Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Users</span>
                <Users className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {metrics.totalUsers}
              </div>
              <span className="text-[10px] text-slate-500">Registered system accounts</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Vault Files</span>
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {metrics.totalDocuments}
              </div>
              <span className="text-[10px] text-slate-500">Stored payment documents</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Evaluated</span>
                <Activity className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {metrics.totalEvaluations}
              </div>
              <span className="text-[10px] text-slate-500">Payment safety checks</span>
            </div>

            <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">High Risk Flagged</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-900">
                {metrics.highRiskCount}
              </div>
              <span className="text-[10px] text-rose-700 font-medium">Require compliance review</span>
            </div>
          </div>

          {/* Compliance Status Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              System Risk Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700">Low Risk Assessments</span>
                  <span>{metrics.lowRiskCount} evaluations</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        metrics.totalEvaluations
                          ? (metrics.lowRiskCount / metrics.totalEvaluations) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700">Review Required</span>
                  <span>{metrics.reviewCount} evaluations</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${
                        metrics.totalEvaluations
                          ? (metrics.reviewCount / metrics.totalEvaluations) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-700">High Risk Caution</span>
                  <span>{metrics.highRiskCount} evaluations</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${
                        metrics.totalEvaluations
                          ? (metrics.highRiskCount / metrics.totalEvaluations) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Real-time Security Audit Log</h3>
            <span className="text-xs text-slate-500">Auto-recorded security events</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-4 text-xs flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        log.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : log.severity === 'warn'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-800">{log.userEmail}</span>
                  </div>
                  <p className="text-slate-600 font-medium">{log.details}</p>
                </div>

                <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Global Documents Vault */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">System Documents Overview</h3>
          </div>

          {globalDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No documents stored in system vault yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {globalDocs.map((doc) => (
                <div key={doc.id} className="p-4 text-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-500">
                        Uploaded by <strong>{doc.userEmail}</strong> on {formatDate(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`${doc.downloadUrl}?token=${localStorage.getItem('finguard_auth_token_v1') || ''}`}
                    download={doc.fileName}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
