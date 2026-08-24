import { StoredDocument, ExtractedDocumentData } from '../types';
import { getStoredToken } from './authService';
import { BUCKET_NAME } from '../supabase';

export async function uploadDocumentApi(
  file: File,
  extractedData?: ExtractedDocumentData,
  storagePath?: string,
  storageBucket?: string
): Promise<StoredDocument> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('You must be logged in to store documents.');
  }

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageBucket: storageBucket || BUCKET_NAME,
      storagePath: storagePath || `documents/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      extractedData,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Document registration failed.');
  }

  return data.document as StoredDocument;
}

export async function fetchUserDocumentsApi(): Promise<StoredDocument[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch('/api/documents', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.documents || [];
  } catch (err) {
    console.error('Error fetching documents:', err);
    return [];
  }
}

export async function deleteDocumentApi(docId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`/api/documents/${docId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (err) {
    console.error('Error deleting document:', err);
    return false;
  }
}
