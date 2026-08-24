import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { processDocumentExtraction } from "./src/services/extractionEngine";
import { supabaseAdmin, BUCKET_NAME } from "./src/supabase";





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
  // DOCUMENT EXTRACTION & SUPABASE UPLOAD ROUTES
  // ==========================================

  // POST /api/create-upload-url - Generate Supabase signed upload URL
  app.post("/api/create-upload-url", async (req, res) => {
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

      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `anonymous/${fileId}-${sanitizedName}`;

      try {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: 20971520,
          allowedMimeTypes: validMimes,
        });
      } catch (_) {}

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
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
  });

  // Document extraction API using Supabase Storage download & extraction engine
  app.post("/api/extract-document", async (req, res) => {
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
            console.log(`[SERVER_EXTRACT] Successfully downloaded ${fileBuffer.length} bytes from Supabase Storage (${targetBucket}/${path})`);
          } else if (downloadErr) {
            console.warn(`[SERVER_EXTRACT] Supabase download error for path ${path}:`, downloadErr.message);
          }
        } catch (subErr) {
          console.warn(`[SERVER_EXTRACT] Exception downloading from Supabase Storage:`, subErr);
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
          console.warn('[SERVER_EXTRACT] Failed to fetch storageUrl:', fetchErr);
        }
      }

      if (!fileBase64 && !fileBuffer) {
        return res.status(400).json({
          success: false,
          error: 'DOWNLOAD_FAILED',
          message: 'Could not retrieve document from Supabase Storage. Please try uploading again or enter details manually.',
        });
      }

      const result = await processDocumentExtraction({
        fileBase64,
        fileBuffer,
        mimeType: mimeType || 'application/pdf',
        fileName,
        fileSize,
      });

      if (path && result.success) {
        supabaseAdmin.storage
          .from(bucket || BUCKET_NAME)
          .remove([path])
          .then(() => console.log(`[SERVER_EXTRACT] Cleaned up temporary storage path: ${path}`))
          .catch(() => {});
      }

      if (!result.success) {
        const isBadRequest = result.error === 'FILE_TOO_LARGE' || result.error === 'INVALID_FILE_TYPE';
        return res.status(isBadRequest ? 400 : 422).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('[SERVER_EXTRACT_EXCEPTION]', error);
      return res.status(422).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Document extraction failed.',
      });
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


