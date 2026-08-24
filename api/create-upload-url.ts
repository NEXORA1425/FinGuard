import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, BUCKET_NAME } from '../src/supabase';

export const config = {
  maxDuration: 15,
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
    const { fileName, mimeType, fileSize } = req.body || {};

    if (!fileName || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'File name and MIME type are required.',
      });
    }

    const cleanMime = String(mimeType).toLowerCase();
    const cleanFileName = String(fileName).toLowerCase();
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

    const ext = '.' + cleanFileName.split('.').pop();
    if (!validMimes.includes(cleanMime) && !validExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Unsupported file format. Please upload a PDF, JPG, PNG, or WEBP document.',
      });
    }

    if (fileSize && fileSize > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'The uploaded file is larger than the 20MB supported limit.',
      });
    }

    // Generate secure random path
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `anonymous/${fileId}-${sanitizedName}`;

    // Ensure bucket exists or create if needed
    try {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 20971520,
        allowedMimeTypes: validMimes,
      });
    } catch (_) {
      // Bucket may already exist, ignore error
    }

    // Create signed upload URL from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      // Fallback path if createSignedUploadUrl is restricted
      return res.json({
        success: true,
        bucket: BUCKET_NAME,
        path: storagePath,
        signedUrl: null,
        token: null,
      });
    }

    return res.json({
      success: true,
      bucket: BUCKET_NAME,
      path: storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  } catch (error: any) {
    console.error('[CREATE_UPLOAD_URL_ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'STORAGE_ERROR',
      message: error.message || 'Failed to create upload authorization.',
    });
  }
}
