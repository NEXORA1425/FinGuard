import React, { useState, useRef } from 'react';
import { ExtractedDocumentData } from '../types';
import { parsePaymentDocument } from '../services/documentParser';
import { uploadDocumentApi } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
  RefreshCw,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface DocumentUploadCardProps {
  onDetailsExtracted: (
    data: ExtractedDocumentData,
    fileInfo: { name: string; size: number; type: string }
  ) => void;
  activeFileInfo: { name: string; size: number; type: string } | null;
  onClearFile: () => void;
  onSwitchToManual?: () => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  onDetailsExtracted,
  activeFileInfo,
  onClearFile,
  onSwitchToManual,
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVaultSaved, setIsVaultSaved] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const validMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType =
      validMimeTypes.includes(file.type) || validExtensions.includes(fileExtension);
    if (!isValidType) {
      setUploadStatus('error');
      setErrorMessage(
        "Invalid file format. Please upload a PDF invoice, JPG, PNG, or WEBP image."
      );
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadStatus('error');
      setErrorMessage(
        "File size exceeds 20MB limit. Please upload a smaller document."
      );
      return;
    }

    setErrorMessage(null);
    setUploadStatus('idle');
    setIsProcessing(true);
    setIsVaultSaved(false);

    try {
      // Step 1: AI Metadata Extraction via Gemini
      const result = await parsePaymentDocument(file);

      if (!result.success || !result.data) {
        setUploadStatus('error');
        setErrorMessage(
          result.error ||
            "We couldn't reliably read this document. Please enter the payment details manually."
        );
        return;
      }

      // Step 2: Store in user vault if logged in
      if (user) {
        try {
          await uploadDocumentApi(file, result.data);
          setIsVaultSaved(true);
        } catch (vaultErr) {
          console.warn('Vault saving warning:', vaultErr);
        }
      }

      setUploadStatus('success');
      onDetailsExtracted(result.data, {
        name: file.name,
        size: file.size,
        type: file.type || fileExtension.replace('.', '').toUpperCase(),
      });
    } catch (err) {
      console.warn('Document processing error:', err);
      setUploadStatus('error');
      setErrorMessage(
        "We couldn't reliably read this document. Please enter the payment details manually."
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleReset = () => {
    setUploadStatus('idle');
    setErrorMessage(null);
    setIsVaultSaved(false);
    onClearFile();
  };

  return (
    <div
      id="document-upload-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-4.5 sm:p-6 md:p-7 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-700 flex-shrink-0" />
            <span>Upload a Payment Request</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Upload an invoice, bill, payment request, or screenshot for automated risk inspection.
          </p>
        </div>
      </div>

      {/* Hidden File Input supporting PDF, JPG, PNG, and WEBP */}
      <input
        ref={fileInputRef}
        type="file"
        id="input-payment-document"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Active Success File State or Upload Area */}
      {activeFileInfo && uploadStatus === 'success' ? (
        <div
          id="upload-status-success"
          className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-full">
                  {activeFileInfo.name}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 flex-shrink-0">
                  Extracted
                </span>
                {isVaultSaved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Saved to Vault</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {formatFileSize(activeFileInfo.size)} · {activeFileInfo.type.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button
              type="button"
              id="btn-replace-document"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              id="btn-remove-document"
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          id="dropzone-payment-document"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 sm:p-7 md:p-8 text-center transition-all ${
            isDragging
              ? 'border-slate-900 bg-slate-100/90 scale-[0.99]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          {isProcessing ? (
            <div id="upload-status-processing" className="py-4 space-y-3">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-slate-800 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-900">
                Analyzing payment document with Gemini AI...
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Extracting payee name, total amount, urgency phrasing, and account instructions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Drag and drop your file here, or
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Supports PDF, JPG, PNG, WEBP (up to 20MB)
                </p>
              </div>
              <button
                type="button"
                id="btn-choose-file"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer hover:border-slate-400 min-h-[44px]"
              >
                <span>Choose File</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error / Fallback Message */}
      {errorMessage && (
        <div
          id="upload-status-error"
          className="mt-4 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 leading-relaxed animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 text-xs sm:text-sm">
                {errorMessage}
              </p>
            </div>
          </div>

          {onSwitchToManual && (
            <button
              type="button"
              id="btn-fallback-manual-entry"
              onClick={onSwitchToManual}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/50 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer flex-shrink-0 min-h-[40px] w-full sm:w-auto"
            >
              <span>Enter Manually</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
