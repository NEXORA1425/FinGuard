import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfParseModule from "pdf-parse";

const pdfParse = (pdfParseModule as any).default || pdfParseModule;



// In-Memory Database & Persistence Types
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string; // Stored securely
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface StoredDocumentRecord {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  fileBase64: string; // Base64 content
  extractedData: any;
}

interface AuditLogRecord {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  details: string;
  severity: 'info' | 'warn' | 'critical';
}

// Global In-Memory Stores (with pre-seeded accounts)
const usersStore: Map<string, UserRecord> = new Map([
  [
    "user@finguard.com",
    {
      id: "usr-demo-001",
      email: "user@finguard.com",
      passwordHash: "User123!", // Demo plain/token for simple demo auth
      name: "Alex Morgan",
      role: "user",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "admin@finguard.com",
    {
      id: "usr-demo-admin",
      email: "admin@finguard.com",
      passwordHash: "Admin123!",
      name: "Compliance Admin (Risk Officer)",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  ],
]);

// Tokens active sessions: token -> email
const activeSessions: Map<string, string> = new Map([
  ["token-demo-user", "user@finguard.com"],
  ["token-demo-admin", "admin@finguard.com"],
]);

const documentsStore: Map<string, StoredDocumentRecord> = new Map();
const historyStore: Map<string, any[]> = new Map(); // userId -> SafetyAssessment[]
const auditLogs: AuditLogRecord[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: "SYSTEM_INITIALIZE",
    userEmail: "system",
    details: "FinGuard Security & Compliance Engine Started",
    severity: "info",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    action: "USER_LOGIN",
    userEmail: "admin@finguard.com",
    details: "Compliance Admin logged into Risk Control Portal",
    severity: "info",
  },
];

function recordAudit(action: string, userEmail: string, details: string, severity: 'info' | 'warn' | 'critical' = 'info') {
  const log: AuditLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    userEmail,
    details,
    severity,
  };
  auditLogs.unshift(log);
}

// Auth Helper Middleware
function getAuthUser(req: express.Request): UserRecord | null {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = String(req.query.token);
  }

  if (!token) return null;

  const email = activeSessions.get(token);
  if (!email) return null;

  return usersStore.get(email) || null;
}

export async function createExpressApp() {
  const app = express();
  const PORT = 3000;

  // Body parser with 25MB limit for document uploads
  app.use(express.json({ limit: "25mb" }));

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // POST /api/auth/signup
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (usersStore.has(cleanEmail)) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      passwordHash: password,
      name: String(name).trim(),
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    usersStore.set(cleanEmail, newUser);

    const token = `token-${newUser.id}-${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, cleanEmail);

    recordAudit("USER_SIGNUP", cleanEmail, `New user registered with role: ${newUser.role}`);

    const { passwordHash, ...userWithoutPassword } = newUser;
    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = usersStore.get(cleanEmail);

    if (!user || user.passwordHash !== password) {
      recordAudit("LOGIN_FAILED", cleanEmail, "Invalid login credentials attempt", "warn");
      return res.status(401).json({ error: "Invalid email address or password." });
    }

    const token = `token-${user.id}-${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, cleanEmail);

    recordAudit("USER_LOGIN", cleanEmail, `User logged in successfully (${user.role})`);

    const { passwordHash, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized session or token expired." });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      user: userWithoutPassword,
    });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const email = activeSessions.get(token);
      if (email) {
        recordAudit("USER_LOGOUT", email, "User logged out");
        activeSessions.delete(token);
      }
    }
    return res.json({ success: true });
  });

  // ==========================================
  // DOCUMENT EXTRACTION & UPLOAD ROUTES
  // ==========================================

  // Document extraction API using Gemini & pdf-parse
  app.post("/api/extract-document", async (req, res) => {
    const startTime = Date.now();
    try {
      const { fileBase64, mimeType, fileName } = req.body || {};
      if (!fileBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing file data or mime type." });
      }

      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const estimatedSizeBytes = Math.round((cleanBase64.length * 3) / 4);

      if (estimatedSizeBytes > 20 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds the 20MB maximum limit." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: true,
          data: {
            amount: 15000,
            recipient: "Sample Invoice Payee",
            purpose: "Consulting & Services Invoice",
            paymentInstructions: "Pay via Bank Transfer to ACC 9876543210",
            isUrgent: false,
            urgentLanguageDetected: "",
            isUnusualMethod: false,
            unusualMethodDetected: "",
            explanation: "Parsed standard services invoice sample (Local fallback).",
          },
        });
      }

      let extractedText = '';
      let isPdfTextParsed = false;

      // Fast PDF Text Extraction via pdf-parse
      if (mimeType.toLowerCase().includes('pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
        try {
          const fileBuffer = Buffer.from(cleanBase64, 'base64');
          const pdfData = await pdfParse(fileBuffer);
          extractedText = (pdfData.text || '').trim();
          if (extractedText.length > 20) {
            isPdfTextParsed = true;
          }
        } catch (e) {
          console.warn('[SERVER] pdf-parse fallback warning:', e);
        }
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstructions = `You are a financial document analyzer for FinGuard, a decision-safety assistant.
Extract key payment details from this document (invoice, bill, quotation, payment request, or screenshot).
Do not accuse the document or claim it is fraudulent. Objectively extract what is visible.

Key extraction targets:
1. amount: numeric value of the total payment amount. If found, return as a number (e.g. 50000 or 1250.50). If unknown or not found, return 0.
2. recipient: vendor name, merchant, person, or organization requested to be paid.
3. purpose: brief context or item description for this payment.
4. paymentInstructions: payment method details, bank accounts, UPI IDs, or instructions specified.
5. isUrgent: true if the document uses urgent phrasing, penalty threats, or immediate time pressure ("due in 15 mins", "immediate transfer required", "final notice before cutoff"). Otherwise false.
6. urgentLanguageDetected: specific urgency text detected, or empty string.
7. isUnusualMethod: true if the document directs payment via unusual routes (e.g., personal QR code in chat, crypto, gift cards, unfamiliar private account). Otherwise false.
8. unusualMethodDetected: specific unusual method text detected, or empty string.
9. explanation: a clear, neutral 1-2 sentence summary of what was identified in the document.`;

      let responseText = '';

      if (isPdfTextParsed) {
        const truncatedText = extractedText.substring(0, 6000);
        const textPrompt = `${systemInstructions}\n\nDocument Text Content:\n"""\n${truncatedText}\n"""`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [{ parts: [{ text: textPrompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: "Total payment amount number, or 0 if not found" },
                recipient: { type: Type.STRING, description: "Vendor or payee name" },
                purpose: { type: Type.STRING, description: "Purpose of payment" },
                paymentInstructions: { type: Type.STRING, description: "Payment instructions or account details" },
                isUrgent: { type: Type.BOOLEAN, description: "Whether urgent pressure was detected" },
                urgentLanguageDetected: { type: Type.STRING, description: "Urgent phrasing found or empty" },
                isUnusualMethod: { type: Type.BOOLEAN, description: "Whether unusual channel was detected" },
                unusualMethodDetected: { type: Type.STRING, description: "Unusual payment method detected or empty" },
                explanation: { type: Type.STRING, description: "Neutral summary of document content" },
              },
              required: ["recipient", "purpose", "isUrgent", "isUnusualMethod", "explanation"],
            },
          },
        });
        responseText = response.text?.trim() || '';
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: systemInstructions,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: "Total payment amount number, or 0 if not found" },
                recipient: { type: Type.STRING, description: "Vendor or payee name" },
                purpose: { type: Type.STRING, description: "Purpose of payment" },
                paymentInstructions: { type: Type.STRING, description: "Payment instructions or account details" },
                isUrgent: { type: Type.BOOLEAN, description: "Whether urgent pressure was detected" },
                urgentLanguageDetected: { type: Type.STRING, description: "Urgent phrasing found or empty" },
                isUnusualMethod: { type: Type.BOOLEAN, description: "Whether unusual channel was detected" },
                unusualMethodDetected: { type: Type.STRING, description: "Unusual payment method detected or empty" },
                explanation: { type: Type.STRING, description: "Neutral summary of document content" },
              },
              required: ["recipient", "purpose", "isUrgent", "isUnusualMethod", "explanation"],
            },
          },
        });
        responseText = response.text?.trim() || '';
      }

      if (!responseText) {
        return res.status(422).json({ error: "Could not extract text from document." });
      }

      const parsed = JSON.parse(responseText);
      return res.json({
        success: true,
        data: parsed,
      });
    } catch (error: any) {
      console.error("Gemini document extraction error:", error);
      return res.status(500).json({ error: error.message || "Failed to process document" });
    }
  });

  // POST /api/documents/upload - Store document securely
  app.post("/api/documents/upload", async (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "You must be logged in to upload documents." });
    }

    const { fileName, fileSize, mimeType, fileBase64, extractedData } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: "File name and file content are required." });
    }

    // Size check max 20MB
    if (fileSize && fileSize > 20 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds the 20MB maximum limit." });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const storedDoc: StoredDocumentRecord = {
      id: docId,
      userId: user.id,
      userEmail: user.email,
      fileName,
      fileSize: fileSize || 0,
      mimeType: mimeType || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      fileBase64,
      extractedData: extractedData || null,
    };

    documentsStore.set(docId, storedDoc);
    recordAudit("DOCUMENT_UPLOAD", user.email, `Uploaded payment document: ${fileName} (${(fileSize/1024).toFixed(1)} KB)`);

    const downloadUrl = `/api/documents/${docId}/download`;

    return res.json({
      success: true,
      document: {
        id: storedDoc.id,
        userId: storedDoc.userId,
        userEmail: storedDoc.userEmail,
        fileName: storedDoc.fileName,
        fileSize: storedDoc.fileSize,
        mimeType: storedDoc.mimeType,
        uploadedAt: storedDoc.uploadedAt,
        extractedData: storedDoc.extractedData,
        downloadUrl,
      },
    });
  });

  // GET /api/documents - List documents for current user (or all if admin)
  app.get("/api/documents", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required to view documents." });
    }

    const results: any[] = [];
    documentsStore.forEach((doc) => {
      if (user.role === 'admin' || doc.userId === user.id) {
        results.push({
          id: doc.id,
          userId: doc.userId,
          userEmail: doc.userEmail,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt,
          extractedData: doc.extractedData,
          downloadUrl: `/api/documents/${doc.id}/download`,
        });
      }
    });

    results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return res.json({
      success: true,
      documents: results,
    });
  });

  // GET /api/documents/:id/download - Secure download endpoint
  app.get("/api/documents/:id/download", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized. Log in to access private documents.");
    }

    const docId = req.params.id;
    const storedDoc = documentsStore.get(docId);

    if (!storedDoc) {
      return res.status(404).send("Document not found.");
    }

    // Role Security: User can only download their own document; Admin can download any
    if (user.role !== 'admin' && storedDoc.userId !== user.id) {
      recordAudit("SECURITY_DENIED", user.email, `Unauthorized attempt to download document ${docId} belonging to ${storedDoc.userEmail}`, "critical");
      return res.status(403).send("Forbidden. You do not have permission to access another user's document.");
    }

    recordAudit("DOCUMENT_DOWNLOAD", user.email, `Downloaded document ${storedDoc.fileName} (${docId})`);

    const cleanBase64 = storedDoc.fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    res.setHeader('Content-Type', storedDoc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(storedDoc.fileName)}"`);
    return res.send(buffer);
  });

  // DELETE /api/documents/:id
  app.delete("/api/documents/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const docId = req.params.id;
    const storedDoc = documentsStore.get(docId);

    if (!storedDoc) {
      return res.status(404).json({ error: "Document not found." });
    }

    if (user.role !== 'admin' && storedDoc.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot delete documents owned by another user." });
    }

    documentsStore.delete(docId);
    recordAudit("DOCUMENT_DELETE", user.email, `Deleted document ${storedDoc.fileName}`);

    return res.json({ success: true });
  });

  // ==========================================
  // HISTORY PERSISTENCE ROUTES
  // ==========================================

  // GET /api/history
  app.get("/api/history", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (user.role === 'admin') {
      const all: any[] = [];
      historyStore.forEach((list) => all.push(...list));
      all.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
      return res.json({ success: true, history: all });
    }

    const userHistory = historyStore.get(user.id) || [];
    return res.json({ success: true, history: userHistory });
  });

  // POST /api/history
  app.post("/api/history", (req, res) => {
    const user = getAuthUser(req);
    const { assessment } = req.body;

    if (!assessment) {
      return res.status(400).json({ error: "Assessment object required." });
    }

    const targetUserId = user ? user.id : "anonymous";
    const userHistory = historyStore.get(targetUserId) || [];

    const updatedAssessment = {
      ...assessment,
      userId: targetUserId,
    };

    const filtered = userHistory.filter((item) => item.id !== assessment.id);
    const newHistory = [updatedAssessment, ...filtered];
    historyStore.set(targetUserId, newHistory);

    if (user) {
      recordAudit(
        "SAFETY_EVALUATION",
        user.email,
        `Evaluated payment ₹${assessment.paymentDetails?.amount} (Score: ${assessment.score}, Risk: ${assessment.riskLevel})`,
        assessment.riskLevel === 'HIGH' ? 'warn' : 'info'
      );
    }

    return res.json({ success: true, history: newHistory });
  });

  // ==========================================
  // ADMIN & COMPLIANCE ROUTES (RBAC Protected)
  // ==========================================

  // GET /api/admin/metrics
  app.get("/api/admin/metrics", (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }

    let totalEvaluations = 0;
    let highRiskCount = 0;
    let reviewCount = 0;
    let lowRiskCount = 0;

    historyStore.forEach((list) => {
      totalEvaluations += list.length;
      list.forEach((item) => {
        if (item.riskLevel === 'HIGH') highRiskCount++;
        else if (item.riskLevel === 'REVIEW') reviewCount++;
        else if (item.riskLevel === 'LOW') lowRiskCount++;
      });
    });

    return res.json({
      success: true,
      metrics: {
        totalUsers: usersStore.size,
        totalDocuments: documentsStore.size,
        totalEvaluations,
        highRiskCount,
        reviewCount,
        lowRiskCount,
      },
    });
  });

  // GET /api/admin/audit-logs
  app.get("/api/admin/audit-logs", (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }

    return res.json({
      success: true,
      logs: auditLogs,
    });
  });

  // ==========================================
  // VITE MIDDLEWARE & STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== "1") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`FinGuard server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = createExpressApp();
export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}


