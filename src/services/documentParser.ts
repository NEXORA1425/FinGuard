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
 * Production-Safe Document Parsing Service via Supabase Storage
 * 1. Validates file locally (MIME, extension, 20MB size).
 * 2. Requests signed upload URL / path authorization from /api/create-upload-url.
 * 3. Uploads file directly to private Supabase Storage bucket 'payment-documents'.
 * 4. Passes storage reference (bucket & path) to /api/extract-document.
 * 5. Returns structured payment analysis payload.
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

    // Step 1: Request upload URL / storage path authorization from backend
    const authRes = await fetch('/api/create-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType,
        fileSize: file.size,
      }),
    });

    let storageBucket = BUCKET_NAME;
    let storagePath = `anonymous/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let signedToken: string | null = null;

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.success) {
        storageBucket = authData.bucket || BUCKET_NAME;
        storagePath = authData.path || storagePath;
        signedToken = authData.token || null;
      }
    }

    onStageChange?.('Uploading file to Supabase Storage...');

    // Step 2: Upload File directly to Supabase Storage
    let isUploadSuccessful = false;

    if (signedToken) {
      try {
        const { error: signedUploadErr } = await supabase.storage
          .from(storageBucket)
          .uploadToSignedUrl(storagePath, signedToken, file, {
            contentType: mimeType,
            upsert: true,
          });

        if (!signedUploadErr) {
          isUploadSuccessful = true;
        } else {
          console.warn('Signed URL upload warning:', signedUploadErr.message);
        }
      } catch (sErr) {
        console.warn('Signed upload exception:', sErr);
      }
    }

    // Direct Supabase storage fallback upload if signed token was not returned
    if (!isUploadSuccessful) {
      const { error: directUploadErr } = await supabase.storage
        .from(storageBucket)
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: true,
        });

      if (!directUploadErr) {
        isUploadSuccessful = true;
      } else {
        console.warn('Direct Supabase upload notice:', directUploadErr.message);
      }
    }

    onStageChange?.('Uploaded');

    // 25-second AbortController timeout to prevent hanging UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    onStageChange?.('Parsing text & pages...');

    const stageTimer = setTimeout(() => {
      onStageChange?.('Analyzing document with Gemini AI...');
    }, 1200);

    // Step 3: Send storage path reference (NOT Base64) to extraction API!
    let extractionPayload: any = {
      bucket: storageBucket,
      path: storagePath,
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    };

    // If Supabase upload was blocked by browser network, fallback to base64 for small files
    if (!isUploadSuccessful && file.size <= 3 * 1024 * 1024) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read document buffer'));
      });
      reader.readAsDataURL(file);
      extractionPayload.fileBase64 = await base64Promise;
    }

    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(extractionPayload),
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
      error: err.message || "We couldn't read this document. Please enter payment details manually.",
    };
  }
}
