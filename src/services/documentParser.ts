import { ExtractedDocumentData } from '../types';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface ParseDocumentResult {
  success: boolean;
  data?: ExtractedDocumentData;
  error?: string;
  errorCode?: string;
}

export type ParsingStage =
  | 'Reading file...'
  | 'Uploading document payload...'
  | 'Parsing text & pages...'
  | 'Analyzing document with Gemini AI...'
  | 'Finalizing extraction details...';

/**
 * Production-Safe Document Parsing Service
 * Supports PDF, JPG, PNG, and WEBP files up to 20MB.
 * For large files (> 2.5 MB), uses direct Firebase Storage reference to bypass Vercel serverless JSON payload limits.
 */
export async function parsePaymentDocument(
  file: File,
  onStageChange?: (stage: ParsingStage) => void
): Promise<ParseDocumentResult> {
  const validMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ];
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

  const isMimeValid = validMimes.includes(file.type);
  const isExtValid = validExts.includes(fileExt);

  if (!isMimeValid && !isExtValid) {
    return {
      success: false,
      errorCode: 'INVALID_FILE_TYPE',
      error: 'Unsupported file format. Please upload a PDF invoice, JPG, PNG, or WEBP image.',
    };
  }

  // Maximum file size limit: 20MB
  if (file.size > 20 * 1024 * 1024) {
    return {
      success: false,
      errorCode: 'FILE_TOO_LARGE',
      error: 'The uploaded file is larger than the 20MB supported limit.',
    };
  }

  try {
    onStageChange?.('Reading file...');

    const mimeType =
      file.type || (fileExt === '.pdf' ? 'application/pdf' : 'image/jpeg');

    let requestBody: any = {
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    };

    onStageChange?.('Uploading document payload...');

    // If file is > 2.5 MB, upload to storage first to bypass Vercel serverless 4.5MB JSON payload limit!
    if (file.size > 2.5 * 1024 * 1024) {
      try {
        const storageRef = ref(storage, `temp_uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await uploadBytes(storageRef, file);
        const storageUrl = await getDownloadURL(storageRef);
        requestBody.storageUrl = storageUrl;
      } catch (storageErr) {
        console.warn('Firebase Storage upload fallback warning:', storageErr);
        // Fallback to base64 if Firebase Storage fails
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read document buffer'));
        });
        reader.readAsDataURL(file);
        requestBody.fileBase64 = await base64Promise;
      }
    } else {
      // Small file (< 2.5MB): send base64 directly
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read document buffer'));
      });
      reader.readAsDataURL(file);
      requestBody.fileBase64 = await base64Promise;
    }

    // 25-second AbortController timeout to prevent hanging UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    onStageChange?.('Parsing text & pages...');

    const stageTimer = setTimeout(() => {
      onStageChange?.('Analyzing document with Gemini AI...');
    }, 1200);

    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    clearTimeout(timeoutId);
    clearTimeout(stageTimer);

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.success) {
      return {
        success: false,
        errorCode: payload.error || 'EXTRACTION_FAILED',
        error: payload.message || payload.error || "We couldn't read this document. Please try another PDF/image or enter details manually.",
      };
    }

    onStageChange?.('Finalizing extraction details...');

    if (!payload.data) {
      return {
        success: false,
        errorCode: 'EMPTY_DOCUMENT',
        error: "We couldn't extract details from this document. Please enter details manually.",
      };
    }

    return {
      success: true,
      data: payload.data as ExtractedDocumentData,
    };
  } catch (err: any) {
    console.error('Payment document parsing error:', err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        errorCode: 'TIMEOUT',
        error: 'Document extraction timed out after 25 seconds. Please enter payment details manually.',
      };
    }
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      error: err.message || 'We couldn\'t read this document. Please enter the payment details manually.',
    };
  }
}
