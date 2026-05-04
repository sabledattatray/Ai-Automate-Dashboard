import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import csvParser from "csv-parser";
import admin from "firebase-admin";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: "uploads/" });
const db = new DatabaseSync("database.sqlite");
db.exec("PRAGMA synchronous = OFF");
db.exec("PRAGMA journal_mode = MEMORY");

// Async wrapper to catch errors in Express 4
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const requireAdmin = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    console.warn("[ADMIN AUTH] No token provided");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.email !== "sabledattatray@gmail.com") {
      console.warn(`[ADMIN AUTH] Forbidden access attempt from: ${decoded.email}`);
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error("[ADMIN AUTH] Token verification failed:", err.message);
    res.status(401).json({ error: `Unauthorized: ${err.message}` });
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Admin
  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
        admin.initializeApp();
      } else {
        admin.initializeApp({
           projectId: "gen-lang-client-0544770816"
        });
      }
      console.log("[ADMIN AUTH] Firebase Admin initialized");
    } catch (e) {
      console.error("[ADMIN AUTH] Failed to initialize Firebase Admin:", e);
    }
  }

  app.use((req, res, next) => {
    console.log(`[LOG] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  
  // Basic CORS/OPTIONS handler
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
  });

  // API router setup
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, firebaseInit: admin.apps.length > 0 });
  });

  apiRouter.get("/admin/users", requireAdmin, asyncHandler(async (req, res) => {
    try {
      console.log("[ADMIN] Fetching users list...");
      const listUsersResult = await admin.auth().listUsers(100);
      res.json(listUsersResult.users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
        providers: u.providerData.map(p => p.providerId)
      })));
    } catch (err: any) {
      console.error("[ADMIN] List users error:", err);
      
      const msg = (err.message || "").toLowerCase();
      const code = err.code || "";
      
      const isConfigError = 
        msg.includes('credential') || 
        msg.includes('identitytoolkit') || 
        msg.includes('identity toolkit') ||
        msg.includes('project_not_found') ||
        code.includes('auth/operation-not-allowed') ||
        code.includes('auth/configuration-not-found');

      if (isConfigError) {
         res.status(503).json({ 
            error: "SERVICE_ACCOUNT_REQUIRED", 
            message: "Action Required: The 'Identity Toolkit API' is likely disabled or your Firebase project is not fully configured for Admin access.",
            details: err.message,
            projectId: admin.app().options.projectId
         });
      } else {
         res.status(500).json({ 
           error: "Internal Server Error", 
           message: err.message || "Failed to list users",
           code: err.code
         });
      }
    }
  }));

  apiRouter.put("/admin/users/:uid/password", requireAdmin, asyncHandler(async (req, res) => {
    try {
      const { password } = req.body;
      const { uid } = req.params;
      if (!password || password.length < 6) return res.status(400).json({ error: "Password too short" });
      await admin.auth().updateUser(uid, { password });
      res.json({ success: true });
    } catch (err: any) {
      console.error(`[ADMIN] Update password error for ${req.params.uid}:`, err);
      res.status(500).json({ error: err.message || "Failed to update password" });
    }
  }));

  apiRouter.delete("/admin/users/:uid", requireAdmin, asyncHandler(async (req, res) => {
    try {
      const { uid } = req.params;
      await admin.auth().deleteUser(uid);
      res.json({ success: true });
    } catch (err: any) {
      console.error(`[ADMIN] Delete user error for ${req.params.uid}:`, err);
      res.status(500).json({ error: err.message || "Failed to delete user" });
    }
  }));

  // Data APIs
  apiRouter.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileId = req.file.filename;
    const tableName = `data_${fileId}`;
    
    let columns: string[] = [];
    let batch: any[] = [];
    let previewData: any[] = [];
    const BATCH_SIZE = 5000;
    
    const finishStream = () => {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        let rowCount = 0;
        try {
            const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
            if (countRow) rowCount = countRow.count;
        } catch (e) {}
        res.json({ id: tableName, columns, sampleData: previewData, rowCount });
    };

    const flushBatch = () => {
       if (batch.length === 0) return;
       try {
         db.exec("BEGIN TRANSACTION");
         const placeholders = columns.map(() => "?").join(", ");
         const stmt = db.prepare(`INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`);
         for (const row of batch) {
             stmt.run(...columns.map(k => {
                 let val = row[k];
                 if (val === undefined) return null;
                 if (typeof val === "string") {
                     val = val.trim();
                     const cleanStr = val.replace(/[$,]/g, "");
                     if (!isNaN(Number(cleanStr)) && cleanStr !== "") return Number(cleanStr);
                 }
                 return val;
             }));
         }
         db.exec("COMMIT");
       } catch(err) {
         console.error("Commit error:", err);
         db.exec("ROLLBACK");
       }
       batch = [];
    };
    
    const stream = fs.createReadStream(req.file.path).pipe(csvParser());
    let isCreated = false;

    stream.on("headers", (headers) => {
      columns = headers.map(h => h.trim()).filter(h => h.length > 0);
      const colsSql = columns.map(c => `"${c}" TEXT`).join(", ");
      db.exec(`CREATE TABLE ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, ${colsSql})`);
      isCreated = true;
    });
    
    stream.on("data", (data) => {
      if (!isCreated) return;
      if (previewData.length < 100) previewData.push(data);
      batch.push(data);
      if (batch.length >= BATCH_SIZE) flushBatch();
    });

    stream.on("error", (err) => {
       console.error("CSV parse error:", err);
       res.status(500).json({ error: "Failed to parse CSV" });
    });
    
    stream.on("end", () => {
       flushBatch();
       finishStream();
    });
  });

  apiRouter.post("/query", (req, res) => {
      const { tableName, xAxis, yAxis, aggregation, type } = req.body;
      if (!tableName || !tableName.startsWith("data_")) return res.status(400).json({ error: "Invalid table" });
      
      let sql = "";
      if (type === "KPI_CARD") {
          let aggFunc = "SUM";
          if (aggregation === "avg") aggFunc = "AVG";
          if (aggregation === "max") aggFunc = "MAX";
          if (aggregation === "min") aggFunc = "MIN";
          if (aggregation === "count") aggFunc = "COUNT";
          
          if (!yAxis) {
              sql = `SELECT COUNT(*) as value FROM ${tableName}`;
          } else {
              if (aggregation === "count") {
                  sql = `SELECT COUNT(*) as value FROM ${tableName} WHERE "${yAxis}" IS NOT NULL AND "${yAxis}" != ''`;
              } else {
                  sql = `SELECT ${aggFunc}(CAST("${yAxis}" AS NUMERIC)) as value FROM ${tableName} WHERE "${yAxis}" IS NOT NULL AND "${yAxis}" != ''`;
              }
          }
          
          try {
             const row = db.prepare(sql).get() as any;
             res.json([{ name: "Total", value: row ? row.value : 0 }]);
          } catch(err: any) {
             res.status(500).json({ error: err.message });
          }
      } else {
          if (!xAxis) return res.json([]);
          
          let aggFunc = "SUM";
          if (aggregation === "avg") aggFunc = "AVG";
          if (aggregation === "max") aggFunc = "MAX";
          if (aggregation === "min") aggFunc = "MIN";
          if (aggregation === "count") aggFunc = "COUNT";
          
          if (aggregation === "count" || (!yAxis && aggregation !== "count")) {
             sql = `SELECT "${xAxis}" as name, COUNT(*) as value FROM ${tableName} WHERE "${xAxis}" IS NOT NULL GROUP BY "${xAxis}" ORDER BY value DESC LIMIT 100`;
          } else {
             if (!yAxis) return res.json([]); 
             sql = `SELECT "${xAxis}" as name, ${aggFunc}(CAST("${yAxis}" AS NUMERIC)) as value FROM ${tableName} WHERE "${xAxis}" IS NOT NULL AND "${yAxis}" IS NOT NULL AND "${yAxis}" != '' GROUP BY "${xAxis}" ORDER BY value DESC LIMIT 100`;
          }
          
          try {
             const rows = db.prepare(sql).all();
             res.json(rows);
          } catch(err: any) {
             res.status(500).json({ error: err.message });
          }
      }
  });

  apiRouter.all("*", (req, res) => {
    console.log(`[API 404] Unhandled API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found", method: req.method, path: req.url });
  });

  app.use("/api", apiRouter);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[GLOBAL ERROR]", err);
    if (req.path.startsWith("/api/")) {
       return res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (like Vercel), the static files are served by the host
    // or we can serve them manually if needed, but Vercel's standard is to use /api for functions
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Only listen if not in a serverless environment (like Vercel)
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

// Export a promise that resolves to the app for Vercel
export default startServer();
