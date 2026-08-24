import { StoredDocument, ExtractedDocumentData } from '../types';
import { getStoredToken } from './authService';

export async function uploadDocumentApi(
  fileInfo: { name: string; size: number; type: string },
  extractedData?: ExtractedDocumentData,
  storagePath?: string,
  storageBucket?: string
): Promise<StoredDocument> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('You must be logged in to store documents in your vault.');
  }

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      mimeType: fileInfo.type || 'application/octet-stream',
      storagePath,
      storageBucket,
      extractedData,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Document storage in vault failed.');
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
