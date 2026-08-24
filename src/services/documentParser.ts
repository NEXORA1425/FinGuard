import { ExtractedDocumentData } from '../types';

export interface ParseDocumentResult {
  success: boolean;
  data?: ExtractedDocumentData;
  error?: string;
}

export type ParsingStage =
  | 'Reading file...'
  | 'Uploading document payload...'
  | 'Parsing text & pages...'
  | 'Analyzing document with Gemini AI...'
  | 'Finalizing extraction details...';

/**
 * Service function to parse an uploaded payment document (PDF, JPG, PNG, WEBP)
 * via the backend Gemini endpoint and return structured payment details.
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
      error: "Unsupported file format. Please upload a PDF invoice, JPG, PNG, or WEBP image.",
    };
  }

  // Maximum file size limit: 20MB
  if (file.size > 20 * 1024 * 1024) {
    return {
      success: false,
      error: "File size exceeds the 20MB maximum limit. Please upload a smaller file.",
    };
  }

  try {
    onStageChange?.('Reading file...');

    // Read file to Base64 string
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read document buffer'));
    });
    reader.readAsDataURL(file);
    const fileBase64 = await base64Promise;

    const mimeType =
      file.type || (fileExt === '.pdf' ? 'application/pdf' : 'image/jpeg');

    onStageChange?.('Uploading document payload...');

    // 25-second AbortController timeout to prevent hanging UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    onStageChange?.('Parsing text & pages...');

    const stageTimer = setTimeout(() => {
      onStageChange?.('Analyzing document with Gemini AI...');
    }, 1500);

    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        fileBase64,
        mimeType,
        fileName: file.name,
      }),
    });

    clearTimeout(timeoutId);
    clearTimeout(stageTimer);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server responded with status ${response.status}. Please enter details manually.`,
      };
    }

    onStageChange?.('Finalizing extraction details...');

    const payload = await response.json();
    if (!payload.success || !payload.data) {
      return {
        success: false,
        error: payload.error || "We couldn't reliably extract details from this document. Please enter details manually.",
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
        error: "Document extraction timed out after 25 seconds. Please enter payment details manually.",
      };
    }
    return {
      success: false,
      error: err.message || "Failed to process document. Please enter the payment details manually.",
    };
  }
}
