export type RiskLevel = 'LOW' | 'REVIEW' | 'HIGH';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface StoredDocument {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  extractedData: ExtractedDocumentData;
  downloadUrl: string;
}

export interface PaymentFormData {
  amount: number | '';
  recipient: string;
  isFirstTime: boolean | null;
  isUrgent: boolean | null;
  purpose: string;
  isUnusualMethod: boolean | null;
}

export interface RiskFactor {
  id: string;
  iconType: 'warning' | 'alert' | 'clock' | 'channel' | 'amount';
  title: string;
  detectedText: string;
  whyItMattersText: string;
  severity: 'medium' | 'high';
}

export interface RiskFactorBreakdown {
  category: string;
  label: string;
  status: 'ok' | 'review' | 'high';
  detail: string;
}

export interface SafetyAssessment {
  id: string;
  userId?: string;
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  statusText: string;
  factors: RiskFactor[];
  recommendation: string;
  breakdown: RiskFactorBreakdown[];
  paymentDetails: {
    amount: number;
    recipient: string;
    isFirstTime: boolean;
    isUrgent: boolean;
    purpose: string;
    isUnusualMethod: boolean;
  };
  analyzedAt: string;
  decisionStatus?: 'pending' | 'acknowledged' | 'cancelled';
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface ExtractedDocumentData {
  amount: number | null;
  recipient: string;
  purpose: string;
  paymentInstructions?: string;
  isUrgent: boolean;
  urgentLanguageDetected?: string;
  isUnusualMethod: boolean;
  unusualMethodDetected?: string;
  explanation: string;
}

export type NavigationPage = 
  | 'home'
  | 'check'
  | 'analysis'
  | 'result'
  | 'pause'
  | 'history'
  | 'how-it-works'
  | 'login'
  | 'documents'
  | 'admin';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  details: string;
  severity: 'info' | 'warn' | 'critical';
}

