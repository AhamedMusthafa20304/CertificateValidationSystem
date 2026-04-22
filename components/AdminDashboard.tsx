import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, Loader2, QrCode, Download, ArrowLeft, Users, FileText, ClipboardList } from 'lucide-react';
import { generateCertificateHash } from '../utils/crypto';
import { blockchainService } from '../services/blockchain';
import { StudentCertificate, UserProfile } from '../types';
import { WalletStatus } from './WalletStatus';

interface AdminDashboardProps {
  user: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [view, setView] = useState<'HOME' | 'ISSUE' | 'HISTORY'>('HOME');
  const [history, setHistory] = useState<StudentCertificate[]>([]);
  const [formData, setFormData] = useState({ studentName: '', studentId: '', course: '', year: '' });
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const qrConfig = { x: 137.1, y: 223.4, size: 45 };
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedCert, setIssuedCert] = useState<StudentCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'HISTORY') loadHistory();
  }, [view]);

  const loadHistory = async () => {
    try {
      const data = await blockchainService.getIssuedCertificates(user.walletAddress);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTemplateFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setTemplatePreview(base64);
        if (file.type === 'application/pdf') {
          try {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjs.getDocument(base64).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              if (ctx) await page.render({ canvasContext: ctx, viewport } as any).promise;
            }
          } catch (err) { console.error('PDF Preview Error:', err); }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFinalPDF = async (cert: StudentCertificate, download = false) => {
    try {
      const res = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: cert.studentName,
          course: cert.course,
          issuerName: cert.issuerName,
          certificateHash: cert.certificateHash,
          templateBase64: cert.templateImage,
          qrConfig: cert.qrConfig || qrConfig,
        }),
      });
      if (!res.ok) throw new Error('Backend PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cert.studentName}_Certificate.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      return url;
    } catch (e) {
      console.error('PDF Generation Error', e);
      alert('Failed to generate PDF via backend.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssuedCert(null);
    if (!templatePreview || !formData.studentName || !formData.studentId) {
      setError('Please fill all fields and upload a certificate template.');
      return;
    }
    try {
      setIsIssuing(true);
      const uniqueData = `${formData.studentId}-${formData.course}-${formData.year}-${Date.now()}`;
      const hash = await generateCertificateHash(uniqueData);
      const newCert = await blockchainService.issueCertificate({
        studentId: formData.studentId,
        studentName: formData.studentName,
        course: formData.course,
        year: formData.year,
        certificateHash: hash,
        issuerId: user.walletAddress,
        issuerName: user.organization || user.name,
        templateImage: templatePreview,
        qrConfig,
      });
      setIssuedCert(newCert);
    } catch (err: any) {
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setIsIssuing(false);
    }
  };

  const cardGrad = 'linear-gradient(135deg,#f72585 0%,#e85d04 60%,#faa307 100%)';

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === 'HOME') {
    return (
      <div style={{ minHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '48px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', textAlign: 'center', textShadow: '0 2px 20px rgba(0,0,0,0.15)', margin: 0 }}>Admin Actions</h1>
          <WalletStatus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '24px', width: '100%', maxWidth: '900px', marginBottom: '40px' }}>
          {[
            { num: '1', icon: <Users style={{ color: 'white', width: '28px', height: '28px' }} />, title: 'Register New Student', desc: "Create a login account and save the student's profile.", action: () => setView('ISSUE') },
            { num: '2', icon: <FileText style={{ color: 'white', width: '28px', height: '28px' }} />, title: 'Issue Certificate', desc: 'Upload PDF, calculate hash, and anchor it on Sepolia via MetaMask.', action: () => setView('ISSUE') },
            { num: '3', icon: <ClipboardList style={{ color: 'white', width: '28px', height: '28px' }} />, title: 'View All Records', desc: 'Browse all registered students and issued certificates.', action: () => setView('HISTORY') },
          ].map((card, i) => (
            <div key={i} onClick={card.action}
              style={{ background: cardGrad, borderRadius: '20px', padding: '36px 28px', cursor: 'pointer', transition: 'transform 0.2s,box-shadow 0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{card.num}. {card.title}</h2>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontSize: '0.9rem' }}>{card.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: '900px', width: '100%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,220,0.5)', borderLeft: '6px solid #ffd166', borderRadius: '12px', padding: '20px 24px', backdropFilter: 'blur(8px)' }}>
          <p style={{ color: '#ffd166', fontWeight: 700, marginBottom: '6px' }}>Important Note</p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
            Certificate metadata is saved to <strong>MySQL</strong> and the hash is anchored on <strong>Sepolia</strong> via MetaMask.
            Connect your admin wallet (above) before issuing. Verifiers and students do <em>not</em> need MetaMask.
          </p>
        </div>
      </div>
    );
  }

  // ── HISTORY ───────────────────────────────────────────────────────────────
  if (view === 'HISTORY') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <button onClick={() => setView('HOME')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 700, marginBottom: '28px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back to Admin Home
        </button>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '24px' }}>Issuance History</h2>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#f72585,#e85d04)' }}>
                  {['Student', 'Course', 'Date Issued', 'Hash', 'On-Chain', 'Action'].map((h, i) => (
                    <th key={i} style={{ padding: '16px 20px', color: 'white', fontWeight: 700, textAlign: i === 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((cert, i) => (
                  <tr key={cert.certificateHash} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1a1a' }}>{cert.studentName} <span style={{ color: '#888', fontWeight: 400 }}>({cert.studentId})</span></td>
                    <td style={{ padding: '14px 20px', color: '#444' }}>{cert.course}</td>
                    <td style={{ padding: '14px 20px', color: '#444' }}>{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>{cert.certificateHash.substring(0, 10)}...</td>
                    <td style={{ padding: '14px 20px' }}>
                      {cert.ipfsLink
                        ? <a href={cert.ipfsLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>Sepolia ↗</a>
                        : <span style={{ fontSize: '0.75rem', color: '#aaa' }}>DB only</span>}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button onClick={() => generateFinalPDF(cert, true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg,#f72585,#e85d04)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                        <Download style={{ width: '12px', height: '12px' }} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#999' }}>No certificates issued yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── ISSUE CERTIFICATE ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={() => setView('HOME')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 700, marginBottom: '28px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem' }}>
        <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back to Admin Home
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: 0 }}>Issue Certificate</h2>
        <WalletStatus />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left – Form */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #f0f0f0' }}>1. Credential Details</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '6px' }}>Student Name</label>
              <input type="text" name="studentName" value={formData.studentName} onChange={handleInputChange} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #e0e0e0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '6px' }}>Student ID</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleInputChange} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #e0e0e0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '6px' }}>Year</label>
                <input type="number" name="year" value={formData.year} onChange={handleInputChange} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #e0e0e0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '6px' }}>Course Name</label>
              <input type="text" name="course" value={formData.course} onChange={handleInputChange} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #e0e0e0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px', paddingTop: '16px', borderTop: '2px solid #f0f0f0' }}>2. Template & QR Placement</h3>
            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '16px' }}>Upload a background (Image or PDF). QR code fixed at X: 137.1mm, Y: 223.4mm.</p>

            {!templatePreview ? (
              <div style={{ border: '2px dashed #ccc', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f9f9f9', marginBottom: '20px' }}>
                <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleTemplateChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                <Upload style={{ width: '32px', height: '32px', color: '#bbb', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: '#666', fontSize: '0.9rem' }}>Click to upload template</p>
                <p style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '4px' }}>Recommended: A4 Portrait (210×297mm)</p>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div ref={previewRef} style={{ position: 'relative', border: '2px solid #e0d0ff', borderRadius: '12px', overflow: 'hidden', aspectRatio: '210/297', background: '#eee' }}>
                  {templateFile?.type === 'application/pdf'
                    ? <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <img src={templatePreview} alt="Template" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  <div style={{ position: 'absolute', border: '2px solid #7c3aed', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', left: `${(qrConfig.x / 210) * 100}%`, top: `${(qrConfig.y / 297) * 100}%`, width: `${(qrConfig.size / 210) * 100}%`, height: `${(qrConfig.size / 297) * 100}%` }}>
                    <QrCode style={{ width: '50%', height: '50%', color: '#7c3aed', opacity: 0.8 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: '#666', background: '#f5f5f5', padding: '8px 12px', borderRadius: '8px' }}>
                  <span>X: {qrConfig.x}mm &nbsp; Y: {qrConfig.y}mm</span>
                  <button type="button" onClick={() => { setTemplateFile(null); setTemplatePreview(null); }} style={{ color: '#e53e3e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Remove Template</button>
                </div>
              </div>
            )}

            {error && <div style={{ padding: '12px 16px', background: '#fff5f5', color: '#c53030', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

            <button type="submit" disabled={isIssuing} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f72585,#e85d04)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isIssuing ? 0.7 : 1 }}>
              {isIssuing ? <><Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /> Saving to DB & Sepolia…</> : 'Mint & Generate Certificate'}
            </button>
          </form>
        </div>

        {/* Right – Result */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          {issuedCert ? (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '360px' }}>
              <div style={{ width: '72px', height: '72px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle style={{ width: '40px', height: '40px', color: '#38a169' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>Certificate Minted!</h3>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '8px' }}>ID: {issuedCert.certificateId}</p>
              {issuedCert.ipfsLink && (
                <a href={issuedCert.ipfsLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: '16px', fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>View on Sepolia Etherscan ↗</a>
              )}
              <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #eee' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Blockchain Hash</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', color: '#555' }}>{issuedCert.certificateHash}</p>
              </div>
              <button onClick={() => generateFinalPDF(issuedCert, true)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f72585,#e85d04)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download style={{ width: '18px', height: '18px' }} /> Download Official PDF
              </button>
              <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '12px' }}>The student can also access this via their dashboard.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#bbb' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <div style={{ width: '120px', height: '80px', border: '2px dashed #ddd', borderRadius: '8px', background: 'white' }}></div>
                <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode style={{ width: '22px', height: '22px', opacity: 0.5 }} />
                </div>
              </div>
              <p style={{ maxWidth: '220px', margin: '0 auto', lineHeight: 1.5, fontSize: '0.9rem' }}>Upload a template, fill details, and the system will auto-embed the QR code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
