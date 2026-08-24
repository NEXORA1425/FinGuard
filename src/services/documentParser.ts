import { ExtractedDocumentData } from '../types';

export interface ParseDocumentResult {
  success: boolean;
  data?: ExtractedDocumentData;
  error?: string;
}

/**
 * Service function to parse an uploaded payment document (PDF, JPG, PNG)
 * via the backend Gemini endpoint and return structured payment details.
 */
export async function parsePaymentDocument(
  file: File
): Promise<ParseDocumentResult> {
  // Validate supported mime types / extensions
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
      error: "We couldn't reliably read this document. Please enter the payment details manually.",
    };
  }

  // Maximum file size limit: 20MB
  if (file.size > 20 * 1024 * 1024) {
    return {
      success: false,
      error: "We couldn't reliably read this document. Please enter the payment details manually.",
    };
  }

  try {
    // Read file to Base64 string
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file buffer'));
    });
    reader.readAsDataURL(file);
    const fileBase64 = await base64Promise;

    const mimeType =
      file.type || (fileExt === '.pdf' ? 'application/pdf' : 'image/jpeg');

    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileBase64,
        mimeType,
        fileName: file.name,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: "We couldn't reliably read this document. Please enter the payment details manually.",
      };
    }

    const payload = await response.json();
    if (!payload.success || !payload.data) {
      return {
        success: false,
        error: "We couldn't reliably read this document. Please enter the payment details manually.",
      };
    }

    return {
      success: true,
      data: payload.data as ExtractedDocumentData,
    };
  } catch (err) {
    console.error('Payment document parsing error:', err);
    return {
      success: false,
      error: "We couldn't reliably read this document. Please enter the payment details manually.",
    };
  }
}
