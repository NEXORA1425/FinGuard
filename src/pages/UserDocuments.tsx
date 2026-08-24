import React, { useState, useEffect } from 'react';
import { StoredDocument, NavigationPage } from '../types';
import { fetchUserDocumentsApi, deleteDocumentApi } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Trash2, Search, ArrowRight, ShieldCheck, Calendar, FileCode, CheckCircle2 } from 'lucide-react';

interface UserDocumentsProps {
  onNavigate: (page: NavigationPage) => void;
}

export const UserDocuments: React.FC<UserDocumentsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const list = await fetchUserDocumentsApi();
      setDocuments(list);
    } catch (e) {
      console.warn('Failed to load user documents', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document from your vault?')) {
      const ok = await deleteDocumentApi(id);
      if (ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const filteredDocs = documents.filter(
    (doc) =>
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.extractedData?.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Document Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Encrypted Storage</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Secure private repository of analyzed invoices, receipts, and payment requests.
          </p>
        </div>

        <button
          onClick={() => onNavigate('check')}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[42px]"
        >
          <span>Upload New Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter */}
      {documents.length > 0 && (
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by file name or payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
          />
        </div>
      )}

      {/* Documents Grid / Empty State */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-medium">
          Loading document vault...
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">No documents in vault</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5 sm:mb-6">
            Upload payment requests, invoices, or receipts during safety evaluations to store them securely.
          </p>
          <button
            onClick={() => onNavigate('check')}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer min-h-[48px]"
          >
            <span>Upload Document Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{formatSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0 uppercase">
                    {doc.mimeType.includes('pdf') ? 'PDF' : 'IMAGE'}
                  </span>
                </div>

                {/* Extracted context card */}
                {doc.extractedData && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1 my-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Detected Payee:</span>
                      <strong className="text-slate-900">{doc.extractedData.recipient || 'N/A'}</strong>
                    </div>
                    {doc.extractedData.amount ? (
                      <div className="flex justify-between text-slate-600">
                        <span>Extracted Amount:</span>
                        <strong className="text-slate-900">₹{doc.extractedData.amount.toLocaleString('en-IN')}</strong>
                      </div>
                    ) : null}
                    {doc.extractedData.explanation && (
                      <p className="text-[11px] text-slate-500 pt-1 line-clamp-2 italic border-t border-slate-200/50 mt-1">
                        "{doc.extractedData.explanation}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  Owner: {doc.userEmail}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`${doc.downloadUrl}?token=${localStorage.getItem('finguard_auth_token_v1') || ''}`}
                    download={doc.fileName}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
