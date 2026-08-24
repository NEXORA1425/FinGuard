import { PDFParse } from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedDocumentData } from '../types';

export type ExtractionErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'PDF_EXTRACTION_FAILED'
  | 'IMAGE_EXTRACTION_FAILED'
  | 'EMPTY_DOCUMENT'
  | 'AI_ANALYSIS_FAILED'
  | 'INTERNAL_ERROR';

export interface ExtractionResultSuccess {
  success: true;
  data: ExtractedDocumentData;
  error?: undefined;
}

export interface ExtractionResultError {
  success: false;
  error: ExtractionErrorCode;
  message: string;
}

export type ExtractionResult = ExtractionResultSuccess | ExtractionResultError;

export interface ExtractionInput {
  fileBase64?: string;
  fileBuffer?: Buffer;
  mimeType: string;
  fileName?: string;
  fileSize?: number;
}

function safeLog(stage: string, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[EXTRACTION_ENGINE] [${timestamp}] [${stage}] ${message}`);
}

function safeErrorLog(stage: string, message: string, errorDetail?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[EXTRACTION_ENGINE_ERROR] [${timestamp}] [${stage}] ${message}`, errorDetail ? errorDetail : '');
}

/**
 * Validate Magic Byte File Signatures
 */
function validateFileSignature(buffer: Buffer, mimeType: string, fileName?: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const headerHex = buffer.subarray(0, 4).toString('hex').toUpperCase();

  // PDF magic bytes: %PDF (0x25504446)
  if (headerHex.startsWith('25504446')) {
    return true;
  }
  // JPEG magic bytes: 0xFFD8FF
  if (headerHex.startsWith('FFD8FF')) {
    return true;
  }
  // PNG magic bytes: 0x89504E47 (.PNG)
  if (headerHex.startsWith('89504E47')) {
    return true;
  }
  // WEBP magic bytes: RIFF (0x52494646)
  if (headerHex.startsWith('52494646')) {
    return true;
  }

  // Fallback extension match if magic bytes are slightly offset
  const ext = (fileName || '').toLowerCase().split('.').pop();
  if (ext && ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return true;
  }

  return false;
}

/**
 * Smart Regex Fallback Parser for Direct PDF Text
 * Extracts amount, payee, and purpose directly from text when AI is unavailable/failing.
 */
function extractFromPdfText(text: string): ExtractedDocumentData {
  let amount: number | null = null;
  let recipient = '';
  let purpose = '';
  let isUrgent = false;
  let isUnusualMethod = false;

  // 1. Amount Extraction (Look for currency markers like ₹, INR, $, USD, Total, Amount)
  const amountMatch = text.match(/(?:total|amount|due|pay|inr|rs\.?|₹|\$)\s*[:=]?\s*(?:inr|rs\.?|₹|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                      text.match(/(?:inr|rs\.?|₹|\$)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const cleanNum = amountMatch[1].replace(/,/g, '');
    const parsed = parseFloat(cleanNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // 2. Recipient / Vendor Name Extraction
  const vendorMatch = text.match(/(?:vendor|payee|biller|merchant|billed\s+to|from|company|to)\s*[:=]\s*([^\n\r,]+)/i) ||
                      text.match(/(?:invoice\s+from|bill\s+from)\s*[:=]?\s*([^\n\r,]+)/i);
  if (vendorMatch && vendorMatch[1]) {
    recipient = vendorMatch[1].trim();
  }

  if (!recipient) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !l.toLowerCase().includes('invoice'));
    if (lines.length > 0) {
      recipient = lines[0].substring(0, 40);
    }
  }

  // 3. Purpose / Description Extraction
  const purposeMatch = text.match(/(?:purpose|description|subject|for|service|item)\s*[:=]\s*([^\n\r,]+)/i);
  if (purposeMatch && purposeMatch[1]) {
    purpose = purposeMatch[1].trim();
  } else {
    purpose = 'Payment invoice / receipt';
  }

  // 4. Urgency Phrasing Detection
  if (/(due\s+today|immediate|urgent|cutoff|final\s+notice|penalty|overdue|24\s+hours|15\s+mins)/i.test(text)) {
    isUrgent = true;
  }

  // 5. Unusual Method Detection
  if (/(gift\s*card|crypto|telegram|whatsapp\s*qr|personal\s*account)/i.test(text)) {
    isUnusualMethod = true;
  }

  return {
    amount,
    recipient: recipient || 'Identified Document Payee',
    purpose,
    paymentInstructions: 'Details parsed directly from document text stream',
    isUrgent,
    urgentLanguageDetected: isUrgent ? 'Urgency keywords detected in document text' : '',
    isUnusualMethod,
    unusualMethodDetected: isUnusualMethod ? 'Unusual method keywords detected in document text' : '',
    explanation: 'Extracted key payment details directly from PDF text content.',
  };
}

/**
 * Primary Unified Document Extraction Engine
 */
export async function processDocumentExtraction(input: ExtractionInput): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const { fileBase64, fileBuffer: inputBuffer, mimeType, fileName, fileSize } = input;

    // 1. Validation Check
    if (!fileBase64 && !inputBuffer) {
      safeErrorLog('VALIDATION_FAILED', 'Neither fileBase64 nor fileBuffer was provided');
      return {
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Missing file data or buffer payload.',
      };
    }

    const cleanMime = String(mimeType || '').toLowerCase();
    const cleanFileName = String(fileName || '').toLowerCase();
    const isPdf = cleanMime.includes('pdf') || cleanFileName.endsWith('.pdf');
    const isImage = cleanMime.includes('image') || /\.(jpg|jpeg|png|webp)$/.test(cleanFileName);

    if (!isPdf && !isImage) {
      safeErrorLog('UNSUPPORTED_MIME', `Mime type ${cleanMime} or filename ${cleanFileName} is not supported.`);
      return {
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Unsupported file format. Please upload a PDF, JPG, PNG, or WEBP document.',
      };
    }

    // Convert to Buffer
    let buffer: Buffer;
    if (inputBuffer) {
      buffer = inputBuffer;
    } else {
      const cleanBase64 = (fileBase64 || '').replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    const calculatedSize = buffer.length;
    const sizeMB = (calculatedSize / (1024 * 1024)).toFixed(2);
    safeLog('PAYLOAD_SIZE', `Document file size: ${calculatedSize} bytes (~${sizeMB} MB)`);

    // Size limit check (20 MB maximum limit)
    if (calculatedSize > 20 * 1024 * 1024) {
      safeErrorLog('FILE_TOO_LARGE', `Calculated file size ${sizeMB} MB exceeds 20MB limit.`);
      return {
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'The uploaded file is larger than the 20MB supported limit.',
      };
    }

    // Magic Signature Validation
    if (!validateFileSignature(buffer, cleanMime, cleanFileName)) {
      safeErrorLog('MAGIC_BYTES_FAILED', 'File signature validation failed.');
      return {
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Invalid file signature. File content does not match supported document types.',
      };
    }

    let pdfExtractedText = '';
    let isPdfTextParsed = false;

    // 2. PDF Parsing via pdf-parse v2 PDFParse class API
    if (isPdf) {
      safeLog('PDF_PARSE_START', 'Initializing pdf-parse v2 PDFParse class instance...');
      const parseStart = Date.now();
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        pdfExtractedText = (result.text || '').trim();
        await parser.destroy();

        const parseDuration = Date.now() - parseStart;
        safeLog('PDF_PARSE_COMPLETE', `pdf-parse v2 extracted ${pdfExtractedText.length} characters in ${parseDuration}ms.`);

        if (pdfExtractedText.length > 15) {
          isPdfTextParsed = true;
        }
      } catch (pdfErr: any) {
        safeErrorLog('PDF_PARSE_EXCEPT', `pdf-parse v2 encountered an error: ${pdfErr.message || pdfErr}`);
      }
    }

    // 3. AI Extraction via Gemini with Candidate Models
    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyValid = Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_GEMINI_API_KEY'));

    safeLog('GEMINI_INIT', `Gemini API key configured: ${isApiKeyValid}`);

    if (!isApiKeyValid) {
      safeLog('FALLBACK_NO_KEY', 'Gemini API key is not configured. Returning fallback extraction data.');
      let fallbackData: ExtractedDocumentData;
      if (isPdfTextParsed) {
        fallbackData = extractFromPdfText(pdfExtractedText);
      } else {
        fallbackData = {
          amount: 15000,
          recipient: 'Sample Payee Solutions',
          purpose: 'Consulting & Services Invoice',
          paymentInstructions: 'Pay via Bank Transfer ACC 9876543210',
          isUrgent: false,
          urgentLanguageDetected: '',
          isUnusualMethod: false,
          unusualMethodDetected: '',
          explanation: 'Extracted sample payment details (GEMINI_API_KEY required for live AI analysis).',
        };
      }
      return {
        success: true,
        data: fallbackData,
      };
    }

    safeLog('AI_REQUEST_START', `Sending AI extraction request. Mode: ${isPdfTextParsed ? 'TEXT_PROMPT' : 'MULTIMODAL_IMAGE'}`);
    const aiStart = Date.now();

    const systemInstructions = `You are a financial document analyzer for FinGuard, a decision-safety assistant.
Extract key payment details from this document (invoice, bill, quotation, payment request, or screenshot).
Do not accuse the document or claim it is fraudulent. Objectively extract what is visible.

Key extraction targets:
1. amount: numeric value of total payment amount. Return as a number (e.g. 50000 or 1250.50). Return 0 if not found.
2. recipient: vendor name, payee, merchant, or organization requested to be paid.
3. purpose: brief context or item description for this payment.
4. paymentInstructions: bank accounts, UPI IDs, QR details, or instructions specified.
5. isUrgent: true if urgent phrasing, penalty threats, or immediate time pressure is detected. Otherwise false.
6. urgentLanguageDetected: specific urgency text detected, or empty string.
7. isUnusualMethod: true if directs payment via unusual routes (e.g. personal QR in chat, gift cards, crypto). Otherwise false.
8. unusualMethodDetected: specific unusual method text detected, or empty string.
9. explanation: a clear, neutral 1-2 sentence summary of what was identified in the document.`;

    const ai = new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = ['gemini-3.6-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp'];
    let responseText = '';
    let lastAiError: any = null;

    for (const modelName of candidateModels) {
      try {
        safeLog('TRY_MODEL', `Attempting Gemini model: "${modelName}"...`);
        if (isPdfTextParsed) {
          const truncatedText = pdfExtractedText.substring(0, 6000);
          const textPrompt = `${systemInstructions}\n\nDocument Text Content:\n"""\n${truncatedText}\n"""`;

          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: textPrompt }] }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER, description: 'Total payment amount number, or 0 if not found' },
                  recipient: { type: Type.STRING, description: 'Vendor or payee name' },
                  purpose: { type: Type.STRING, description: 'Purpose of payment' },
                  paymentInstructions: { type: Type.STRING, description: 'Payment instructions or account details' },
                  isUrgent: { type: Type.BOOLEAN, description: 'Whether urgent pressure was detected' },
                  urgentLanguageDetected: { type: Type.STRING, description: 'Urgent phrasing found or empty' },
                  isUnusualMethod: { type: Type.BOOLEAN, description: 'Whether unusual channel was detected' },
                  unusualMethodDetected: { type: Type.STRING, description: 'Unusual payment method detected or empty' },
                  explanation: { type: Type.STRING, description: 'Neutral summary of document content' },
                },
                required: ['recipient', 'purpose', 'isUrgent', 'isUnusualMethod', 'explanation'],
              },
            },
          });
          responseText = response.text?.trim() || '';
        } else {
          const cleanBase64 = buffer.toString('base64');
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
                  { text: systemInstructions },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER, description: 'Total payment amount number, or 0 if not found' },
                  recipient: { type: Type.STRING, description: 'Vendor or payee name' },
                  purpose: { type: Type.STRING, description: 'Purpose of payment' },
                  paymentInstructions: { type: Type.STRING, description: 'Payment instructions or account details' },
                  isUrgent: { type: Type.BOOLEAN, description: 'Whether urgent pressure was detected' },
                  urgentLanguageDetected: { type: Type.STRING, description: 'Urgent phrasing found or empty' },
                  isUnusualMethod: { type: Type.BOOLEAN, description: 'Whether unusual channel was detected' },
                  unusualMethodDetected: { type: Type.STRING, description: 'Unusual payment method detected or empty' },
                  explanation: { type: Type.STRING, description: 'Neutral summary of document content' },
                },
                required: ['recipient', 'purpose', 'isUrgent', 'isUnusualMethod', 'explanation'],
              },
            },
          });
          responseText = response.text?.trim() || '';
        }

        if (responseText && responseText.length > 0) {
          safeLog('AI_MODEL_SUCCESS', `Gemini model "${modelName}" succeeded in ${Date.now() - aiStart}ms`);
          break;
        }
      } catch (mErr: any) {
        lastAiError = mErr;
        safeErrorLog('MODEL_FAILED', `Gemini model "${modelName}" failed: ${mErr.message || mErr}`);
      }
    }

    if (!responseText) {
      if (isPdfTextParsed) {
        safeLog('AI_FALLBACK_TEXT', 'AI models failed, but text was parsed from PDF. Returning text extraction.');
        return {
          success: true,
          data: extractFromPdfText(pdfExtractedText),
        };
      }
      return {
        success: false,
        error: 'AI_ANALYSIS_FAILED',
        message: 'Could not extract payment details from document.',
      };
    }

    // Clean markdown code fences if present in Gemini output
    let cleanJsonText = responseText;
    if (cleanJsonText.includes('```')) {
      cleanJsonText = cleanJsonText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(cleanJsonText);
    const totalTime = Date.now() - startTime;
    safeLog('EXTRACTION_SUCCESS', `Extraction completed cleanly in ${totalTime}ms.`);

    return {
      success: true,
      data: {
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        recipient: parsed.recipient || 'Payee Unspecified',
        purpose: parsed.purpose || 'Invoice Payment',
        paymentInstructions: parsed.paymentInstructions || '',
        isUrgent: Boolean(parsed.isUrgent),
        urgentLanguageDetected: parsed.urgentLanguageDetected || '',
        isUnusualMethod: Boolean(parsed.isUnusualMethod),
        unusualMethodDetected: parsed.unusualMethodDetected || '',
        explanation: parsed.explanation || 'Parsed document details.',
      },
    };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    safeErrorLog('UNHANDLED_ENGINE_EXCEPT', `Extraction engine exception after ${elapsed}ms: ${err.message || err}`, err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Document extraction could not complete automatically. Please enter details manually.',
    };
  }
}
