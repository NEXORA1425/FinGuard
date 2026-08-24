import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processDocumentExtraction } from '../src/services/extractionEngine';

export const config = {
  maxDuration: 30, // 30 second maximum timeout on Vercel
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Method Not Allowed. Expected POST.',
    });
  }

  try {
    const { fileBase64, storageUrl, mimeType, fileName, fileSize } = req.body || {};

    let fileBuffer: Buffer | undefined;

    // If storageUrl / downloadUrl was provided (for large files up to 20MB), fetch buffer server-side!
    if (storageUrl && String(storageUrl).startsWith('http')) {
      try {
        const fetchRes = await fetch(storageUrl);
        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        }
      } catch (fetchErr) {
        console.warn('[VERCEL_EXTRACT] Failed to fetch storageUrl server-side:', fetchErr);
      }
    }

    if (!fileBase64 && !fileBuffer) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Missing file data, base64 payload, or storage URL.',
      });
    }

    const result = await processDocumentExtraction({
      fileBase64,
      fileBuffer,
      mimeType,
      fileName,
      fileSize,
    });

    if (!result.success) {
      const isBadRequest = result.error === 'FILE_TOO_LARGE' || result.error === 'INVALID_FILE_TYPE';
      return res.status(isBadRequest ? 400 : 422).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('[VERCEL_EXTRACT_EXCEPTION]', error);
    return res.status(422).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Document extraction failed. Please try again or enter details manually.',
    });
  }
}
