import { StoredDocument, ExtractedDocumentData } from '../types';
import { getStoredToken } from './authService';

export async function uploadDocumentApi(
  file: File,
  extractedData?: ExtractedDocumentData
): Promise<StoredDocument> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('You must be logged in to store documents.');
  }

  // Convert File to Base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read document content'));
  });
  reader.readAsDataURL(file);
  const fileBase64 = await base64Promise;

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
      fileBase64,
      extractedData,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Document upload failed.');
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
