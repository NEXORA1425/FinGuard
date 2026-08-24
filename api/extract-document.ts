import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processDocumentExtraction } from '../src/services/extractionEngine';
import { supabaseAdmin, BUCKET_NAME } from '../src/supabase';

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
    const { bucket, path, storageUrl, fileBase64, mimeType, fileName, fileSize } = req.body || {};

    let fileBuffer: Buffer | undefined;

    // 1. Download document from Supabase Storage using bucket and path
    if (path) {
      const targetBucket = bucket || BUCKET_NAME;
      try {
        const { data: blobData, error: downloadErr } = await supabaseAdmin.storage
          .from(targetBucket)
          .download(path);

        if (blobData && !downloadErr) {
          const arrayBuffer = await blobData.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
          console.log(`[VERCEL_EXTRACT] Successfully downloaded ${fileBuffer.length} bytes from Supabase Storage (${targetBucket}/${path})`);
        } else if (downloadErr) {
          console.warn(`[VERCEL_EXTRACT] Supabase download error for path ${path}:`, downloadErr.message);
        }
      } catch (subErr) {
        console.warn(`[VERCEL_EXTRACT] Exception downloading from Supabase Storage:`, subErr);
      }
    }

    // 2. Secondary fallback: storageUrl download
    if (!fileBuffer && storageUrl && String(storageUrl).startsWith('http')) {
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

    // 3. Validation Check
    if (!fileBase64 && !fileBuffer) {
      return res.status(400).json({
        success: false,
        error: 'DOWNLOAD_FAILED',
        message: 'Could not retrieve document from Supabase Storage. Please try uploading again or enter details manually.',
      });
    }

    // 4. Process Document Extraction Engine
    const result = await processDocumentExtraction({
      fileBase64,
      fileBuffer,
      mimeType: mimeType || 'application/pdf',
      fileName,
      fileSize,
    });

    // 5. Cleanup temporary storage file if requested/applicable
    if (path && result.success) {
      supabaseAdmin.storage
        .from(bucket || BUCKET_NAME)
        .remove([path])
        .then(() => console.log(`[VERCEL_EXTRACT] Cleaned up temporary storage path: ${path}`))
        .catch(() => {});
    }

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
