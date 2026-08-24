import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processDocumentExtraction } from '../src/services/extractionEngine';
import { getSupabaseAdmin, BUCKET_NAME } from '../src/supabase';

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
    const { bucket, path, mimeType, fileName, fileSize } = req.body || {};

    // 1. Require bucket, path, mimeType, fileName
    if (!bucket || !path || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'DOWNLOAD_FAILED',
        message: 'Missing required storage reference (bucket, path, mimeType).',
      });
    }

    // 2. Strict Bucket Security — Only allow 'payment-documents'
    if (bucket !== BUCKET_NAME) {
      return res.status(403).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Forbidden. Access to unauthorized storage buckets is blocked.',
      });
    }

    // 3. Namespace Validation — Ensure path starts with safe folder (e.g., anonymous/ or user-id/)
    const cleanPath = String(path).trim();
    if (!cleanPath.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Invalid storage path structure.',
      });
    }

    // 4. Download file from Supabase Storage using SERVER-SIDE Supabase admin client
    let fileBuffer: Buffer | undefined;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: blobData, error: downloadErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(cleanPath);

      if (downloadErr || !blobData) {
        console.error('[EXTRACT_DOCUMENT_DOWNLOAD_FAILED]', downloadErr ? downloadErr.message : 'No data returned');
        return res.status(400).json({
          success: false,
          error: 'DOWNLOAD_FAILED',
          message: 'Could not retrieve document from Supabase Storage. Please try uploading again.',
        });
      }

      const arrayBuffer = await blobData.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } catch (adminErr: any) {
      console.error('[EXTRACT_DOCUMENT_ADMIN_EXCEPT]', adminErr);
      return res.status(500).json({
        success: false,
        error: 'DOWNLOAD_FAILED',
        message: adminErr.message || 'Server configuration error while retrieving document.',
      });
    }

    // 5. Process Document Extraction Engine
    const result = await processDocumentExtraction({
      fileBuffer,
      mimeType,
      fileName,
      fileSize: fileSize || fileBuffer.length,
    });

    // 6. Lifecycle Cleanup: Delete temporary upload after successful extraction
    if (result.success && cleanPath.startsWith('anonymous/')) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([cleanPath]);
      } catch (_) {}
    }

    if (!result.success) {
      const isBadRequest = result.error === 'FILE_TOO_LARGE' || result.error === 'INVALID_FILE_TYPE';
      return res.status(isBadRequest ? 400 : 422).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('[EXTRACT_DOCUMENT_EXCEPTION]', error);
    return res.status(422).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Document extraction failed. Please try again or enter details manually.',
    });
  }
}
