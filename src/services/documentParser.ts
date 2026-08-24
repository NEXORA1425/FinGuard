import { ExtractedDocumentData } from '../types';
import { supabase, BUCKET_NAME } from '../supabase';

export interface ParseDocumentResult {
  success: boolean;
  data?: ExtractedDocumentData;
  error?: string;
  errorCode?: string;
}

export type ParsingStage =
  | 'Validating file...'
  | 'Requesting upload authorization...'
  | 'Uploading file to Supabase Storage...'
  | 'Uploaded'
  | 'Parsing text & pages...'
  | 'Analyzing document with Gemini AI...'
  | 'Finalizing extraction details...';

/**
 * Production Supabase Storage Document Upload & Parsing Service
 * 1. Validates file locally (MIME, extension, 20MB size).
 * 2. Requests signed upload URL from /api/create-upload-url.
 * 3. Uploads File directly to private Supabase Storage bucket 'payment-documents' via uploadToSignedUrl.
 * 4. Validates upload success BEFORE calling /api/extract-document with ONLY bucket & path (No Base64!).
 * 5. Returns structured payment risk analysis.
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

  onStageChange?.('Validating file...');

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
    const mimeType =
      file.type || (fileExt === '.pdf' ? 'application/pdf' : 'image/jpeg');

    onStageChange?.('Requesting upload authorization...');

    // 1. Request signed upload URL from backend
    const authRes = await fetch('/api/create-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType,
        fileSize: file.size,
      }),
    });

    const authData = await authRes.json().catch(() => ({}));

    if (!authRes.ok || !authData.success || !authData.token || !authData.path) {
      return {
        success: false,
        errorCode: authData.error || 'UPLOAD_AUTHORIZATION_FAILED',
        error: authData.message || 'Unable to prepare secure file upload.',
      };
    }

    const { bucket, path: storagePath, token: signedToken } = authData;

    onStageChange?.('Uploading file to Supabase Storage...');

    // 2. Upload File directly to Supabase Storage via signed URL token (NO Base64!)
    const { error: uploadErr } = await supabase.storage
      .from(bucket || BUCKET_NAME)
      .uploadToSignedUrl(storagePath, signedToken, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error('Supabase signed upload error:', uploadErr.message);
      return {
        success: false,
        errorCode: 'UPLOAD_FAILED',
        error: 'Failed to upload document to storage. Please try again.',
      };
    }

    onStageChange?.('Uploaded');

    // 25-second AbortController timeout to prevent hanging UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    onStageChange?.('Parsing text & pages...');

    const stageTimer = setTimeout(() => {
      onStageChange?.('Analyzing document with Gemini AI...');
    }, 1200);

    // 3. Send ONLY storage path reference to extraction API
    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        bucket: bucket || BUCKET_NAME,
        path: storagePath,
        fileName: file.name,
        mimeType,
        fileSize: file.size,
      }),
    });

    clearTimeout(timeoutId);
    clearTimeout(stageTimer);

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.success) {
      return {
        success: false,
        errorCode: payload.error || 'EXTRACTION_FAILED',
        error: payload.message || payload.error || "We couldn't read this document. Please try another file or enter details manually.",
      };
    }

    onStageChange?.('Finalizing extraction details...');

    if (!payload.data) {
      return {
        success: false,
        errorCode: 'EMPTY_DOCUMENT',
        error: "We couldn't extract payment details from this document. Please enter details manually.",
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
      error: err.message || "We couldn't read this document. Please enter payment details manually.",
    };
  }
}
