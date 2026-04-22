/**
 * server.ts  –  Express + Vite dev server
 *
 * REST API endpoints:
 *   POST   /api/auth/login
 *   POST   /api/certificates
 *   GET    /api/certificates?issuerId=0x…
 *   GET    /api/certificates/student/:studentId
 *   GET    /api/certificates/verify/:hash
 *   PATCH  /api/certificates/:hash/tx
 *   POST   /api/verification-logs
 *   GET    /api/verification-logs?verifierId=0x…
 *   POST   /api/student-uploads
 *   GET    /api/student-uploads/:studentId
 *   POST   /api/generate-certificate  (PDF generation – unchanged)
 */

import express       from 'express';
import { createServer as createViteServer } from 'vite';
import PDFKitDocument   from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import QRCode          from 'qrcode';
import cors            from 'cors';
import bodyParser      from 'body-parser';
import path            from 'path';
import { fileURLToPath } from 'url';
import * as dotenv     from 'dotenv';
import pool            from './database/db.js';
import type { StudentCertificate, UserProfile, VerificationLog, StudentUpload, UserRole } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Utility: map a DB row → StudentCertificate ────────────────────────────────

function rowToCert(r: Record<string, unknown>): StudentCertificate {
  return {
    certificateId  : r.certificate_id as string,
    studentId      : r.student_id     as string,
    studentName    : r.student_name   as string,
    course         : r.course         as string,
    year           : r.year           as string,
    issuerId       : r.issuer_id      as string,
    issuerName     : r.issuer_name    as string,
    issueDate      : Number(r.issue_date),
    certificateHash: r.certificate_hash as string,
    ipfsLink       : (r.ipfs_link     as string | null)  ?? undefined,
    templateImage  : (r.template_image as string | null) ?? undefined,
    qrConfig       : r.qr_config
      ? (typeof r.qr_config === 'string' ? JSON.parse(r.qr_config) : r.qr_config)
      : undefined,
  };
}

// Simple wallet address generator (used only for new user creation)
const generateWallet = () =>
  '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

// ── Server bootstrap ──────────────────────────────────────────────────────────

async function startServer() {
  const app  = express();
  const PORT = parseInt(process.env.PORT ?? '3000');

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // ══════════════════════════════════════════════════════════════════════════════
  //  AUTH
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/auth/login
   * Body: { role: UserRole, name: string, extraId?: string }
   * Returns an existing user or creates a new one.
   */
  app.post('/api/auth/login', async (req, res) => {
    const { role, name, extraId } = req.body as {
      role: UserRole; name: string; extraId?: string;
    };

    if (!role || !name)
      return res.status(400).json({ error: 'role and name are required' });

    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE LOWER(name) = LOWER(?) AND role = ? LIMIT 1',
        [name, role]
      ) as [Record<string, unknown>[], unknown];

      if (rows.length > 0) {
        const u = rows[0];
        return res.json({
          walletAddress: u.wallet_address,
          name         : u.name,
          role         : u.role,
          organization : (u.organization as string | null) ?? undefined,
          studentId    : (u.student_id   as string | null) ?? undefined,
          joinedDate   : Number(u.joined_date),
        } satisfies UserProfile);
      }

      // New user
      const walletAddress = generateWallet();
      const joinedDate    = Date.now();
      const organization  = role !== 'STUDENT' ? (extraId ?? null) : null;
      const studentId     = role === 'STUDENT'  ? (extraId ?? null) : null;

      await pool.query(
        `INSERT INTO users
           (wallet_address, name, role, organization, student_id, joined_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [walletAddress, name, role, organization, studentId, joinedDate]
      );

      return res.status(201).json({
        walletAddress,
        name,
        role,
        organization : organization ?? undefined,
        studentId    : studentId    ?? undefined,
        joinedDate,
      } satisfies UserProfile);

    } catch (err) {
      console.error('[POST /api/auth/login]', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  CERTIFICATES
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/certificates
   * Body: Omit<StudentCertificate, 'certificateId' | 'issueDate'>
   * Creates a new certificate record in MySQL.
   */
  app.post('/api/certificates', async (req, res) => {
    const cert = req.body as Omit<StudentCertificate, 'certificateId' | 'issueDate'>;

    if (!cert.certificateHash)
      return res.status(400).json({ error: 'certificateHash is required' });

    try {
      // Duplicate hash check
      const [existing] = await pool.query(
        'SELECT id FROM certificates WHERE certificate_hash = ?',
        [cert.certificateHash]
      ) as [Record<string, unknown>[], unknown];

      if (existing.length > 0)
        return res.status(409).json({ error: 'Certificate hash already exists' });

      const certificateId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const issueDate     = Date.now();

      await pool.query(
        `INSERT INTO certificates
           (certificate_id, student_id, student_name, course, year,
            issuer_id, issuer_name, issue_date, certificate_hash,
            ipfs_link, template_image, qr_config)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          certificateId,
          cert.studentId,
          cert.studentName,
          cert.course,
          cert.year,
          cert.issuerId,
          cert.issuerName,
          issueDate,
          cert.certificateHash,
          cert.ipfsLink     ?? null,
          cert.templateImage ?? null,
          cert.qrConfig ? JSON.stringify(cert.qrConfig) : null,
        ]
      );

      return res.status(201).json({ ...cert, certificateId, issueDate });

    } catch (err) {
      console.error('[POST /api/certificates]', err);
      return res.status(500).json({ error: 'Failed to issue certificate' });
    }
  });

  /**
   * GET /api/certificates?issuerId=0x…
   * Returns all certificates issued by a given admin wallet.
   */
  app.get('/api/certificates', async (req, res) => {
    const { issuerId } = req.query;
    if (!issuerId) return res.status(400).json({ error: 'issuerId query param required' });

    try {
      const [rows] = await pool.query(
        'SELECT * FROM certificates WHERE issuer_id = ? ORDER BY issue_date DESC',
        [issuerId]
      ) as [Record<string, unknown>[], unknown];

      return res.json(rows.map(rowToCert));
    } catch (err) {
      console.error('[GET /api/certificates]', err);
      return res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  });

  /**
   * GET /api/certificates/student/:studentId
   * Returns all certificates belonging to a student.
   */
  app.get('/api/certificates/student/:studentId', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM certificates WHERE student_id = ? ORDER BY issue_date DESC',
        [req.params.studentId]
      ) as [Record<string, unknown>[], unknown];

      return res.json(rows.map(rowToCert));
    } catch (err) {
      console.error('[GET /api/certificates/student]', err);
      return res.status(500).json({ error: 'Failed to fetch student certificates' });
    }
  });

  /**
   * GET /api/certificates/verify/:hash
   * Looks up a certificate by its SHA-256 hash.
   * Returns null (200) if not found (so the frontend can distinguish
   * "not found" from server errors).
   */
  app.get('/api/certificates/verify/:hash', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM certificates WHERE certificate_hash = ? LIMIT 1',
        [req.params.hash]
      ) as [Record<string, unknown>[], unknown];

      if (rows.length === 0) return res.json(null);
      return res.json(rowToCert(rows[0]));
    } catch (err) {
      console.error('[GET /api/certificates/verify]', err);
      return res.status(500).json({ error: 'Verification lookup failed' });
    }
  });

  /**
   * PATCH /api/certificates/:hash/tx
   * Body: { txHash: string }
   * Called after a Sepolia transaction is confirmed to record the tx hash.
   */
  app.patch('/api/certificates/:hash/tx', async (req, res) => {
    const { txHash } = req.body as { txHash?: string };
    if (!txHash) return res.status(400).json({ error: 'txHash is required' });

    try {
      await pool.query(
        'UPDATE certificates SET tx_hash = ? WHERE certificate_hash = ?',
        [txHash, req.params.hash]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('[PATCH /api/certificates/:hash/tx]', err);
      return res.status(500).json({ error: 'Failed to update tx hash' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  VERIFICATION LOGS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/verification-logs
   * Body: Omit<VerificationLog, 'id'>
   */
  app.post('/api/verification-logs', async (req, res) => {
    const log = req.body as Omit<VerificationLog, 'id'>;
    const id  = Date.now().toString();

    try {
      await pool.query(
        `INSERT INTO verification_logs
           (id, verifier_id, certificate_hash, timestamp, is_valid, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          log.verifierId,
          log.certificateHash,
          log.timestamp ?? Date.now(),
          log.isValid,
          log.notes ?? null,
        ]
      );
      return res.status(201).json({ ...log, id });
    } catch (err) {
      console.error('[POST /api/verification-logs]', err);
      return res.status(500).json({ error: 'Failed to save verification log' });
    }
  });

  /**
   * GET /api/verification-logs?verifierId=0x…
   */
  app.get('/api/verification-logs', async (req, res) => {
    const { verifierId } = req.query;
    if (!verifierId) return res.status(400).json({ error: 'verifierId query param required' });

    try {
      const [rows] = await pool.query(
        'SELECT * FROM verification_logs WHERE verifier_id = ? ORDER BY timestamp DESC',
        [verifierId]
      ) as [Record<string, unknown>[], unknown];

      return res.json(rows.map((r) => ({
        id             : r.id,
        verifierId     : r.verifier_id,
        certificateHash: r.certificate_hash,
        timestamp      : Number(r.timestamp),
        isValid        : Boolean(r.is_valid),
        notes          : (r.notes as string | null) ?? undefined,
      }) satisfies VerificationLog));
    } catch (err) {
      console.error('[GET /api/verification-logs]', err);
      return res.status(500).json({ error: 'Failed to fetch verification logs' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  STUDENT UPLOADS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/student-uploads
   * Body: Omit<StudentUpload, 'id' | 'timestamp'>
   */
  app.post('/api/student-uploads', async (req, res) => {
    const doc = req.body as Omit<StudentUpload, 'id' | 'timestamp'>;
    const id        = Math.random().toString(36).substring(7);
    const timestamp = Date.now();

    try {
      await pool.query(
        `INSERT INTO student_uploads
           (id, student_id, title, category, issuer, date, description, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, doc.studentId, doc.title, doc.category, doc.issuer, doc.date, doc.description ?? null, timestamp]
      );
      return res.status(201).json({ ...doc, id, timestamp });
    } catch (err) {
      console.error('[POST /api/student-uploads]', err);
      return res.status(500).json({ error: 'Failed to save document' });
    }
  });

  /**
   * GET /api/student-uploads/:studentId
   */
  app.get('/api/student-uploads/:studentId', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM student_uploads WHERE student_id = ? ORDER BY timestamp DESC',
        [req.params.studentId]
      ) as [Record<string, unknown>[], unknown];

      return res.json(rows.map((r) => ({
        id         : r.id,
        studentId  : r.student_id,
        title      : r.title,
        category   : r.category,
        issuer     : r.issuer,
        date       : r.date,
        description: (r.description as string | null) ?? '',
        timestamp  : Number(r.timestamp),
      }) satisfies StudentUpload));
    } catch (err) {
      console.error('[GET /api/student-uploads]', err);
      return res.status(500).json({ error: 'Failed to fetch uploads' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  PDF GENERATION  (original logic preserved verbatim)
  // ══════════════════════════════════════════════════════════════════════════════

  app.post('/api/generate-certificate', async (req, res) => {
    try {
      const { studentName, course, issuerName, certificateHash, templateBase64, qrConfig } = req.body;

      if (!studentName || !course || !certificateHash)
        return res.status(400).json({ error: 'Missing required fields' });

      const qrBuffer = await QRCode.toBuffer(certificateHash, {
        type               : 'png',
        width              : 500,
        margin             : 1,
        errorCorrectionLevel: 'H',
      });

      const mmToPt = 2.83465;
      const qrSize = (qrConfig?.size || 45) * mmToPt;
      const xPos   = qrConfig?.x !== undefined
        ? qrConfig.x * mmToPt
        : (210 * mmToPt - qrSize - 20 * mmToPt);
      const yPos   = qrConfig?.y !== undefined
        ? qrConfig.y * mmToPt
        : (297 * mmToPt - qrSize - 20 * mmToPt);

      const isPdfTemplate = templateBase64?.startsWith('data:application/pdf');

      if (isPdfTemplate) {
        const templateBytes = Buffer.from(templateBase64.split(',')[1], 'base64');
        const pdfDoc        = await PDFLibDocument.load(templateBytes);
        const pages         = pdfDoc.getPages();
        const firstPage     = pages[0];
        const qrImage       = await pdfDoc.embedPng(qrBuffer);
        const { height }    = firstPage.getSize();
        const flippedY      = height - yPos - qrSize;

        firstPage.drawImage(qrImage, { x: xPos, y: flippedY, width: qrSize, height: qrSize });
        pdfDoc.setSubject(`CERT_HASH:${certificateHash}`);

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
          `attachment; filename=certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
        return res.send(Buffer.from(pdfBytes));
      }

      const doc = new PDFKitDocument({ size: 'A4', layout: 'portrait', margin: 0, compress: false });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition',
        `attachment; filename=certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
      doc.pipe(res);

      if (templateBase64) {
        try {
          const buf = Buffer.from(templateBase64.split(',')[1], 'base64');
          doc.image(buf, 0, 0, { width: doc.page.width, height: doc.page.height });
        } catch (e) { console.error('Failed to add template image', e); }
      }

      doc.font('Helvetica-Bold').fontSize(30).fillColor('#1e293b').text(studentName, 0, 250, { align: 'center' });
      doc.font('Helvetica').fontSize(18).fillColor('#64748b').text(course, 0, 300, { align: 'center' });
      doc.font('Helvetica-Oblique').fontSize(12).fillColor('#94a3b8')
        .text(`Issued by: ${issuerName || 'Blockchain University'}`, 0, 330, { align: 'center' });
      doc.font('Helvetica').fontSize(1).fillOpacity(0)
        .text(`CERT_HASH:${certificateHash}`, 0, doc.page.height - 2, { lineBreak: false });
      doc.image(qrBuffer, xPos, yPos, { width: qrSize, height: qrSize });
      doc.end();

    } catch (error) {
      console.error('[POST /api/generate-certificate]', error);
      res.status(500).json({ error: 'Failed to generate certificate PDF' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  VITE MIDDLEWARE / STATIC FILES
  // ══════════════════════════════════════════════════════════════════════════════

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server : { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('/*', (_req, _res) => {
      _res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CertiVerifier server → http://0.0.0.0:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

startServer();
