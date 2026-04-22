import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldCheck, ShieldAlert, ScanLine, History, Camera, X, FileUp, Loader2, ArrowLeft } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { StudentCertificate, UserProfile, VerificationLog } from '../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface VerifierProps {
  user: UserProfile;
}

export const VerifierComponent: React.FC<VerifierProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'VERIFY' | 'LOGS'>('VERIFY');
  const [hashInput, setHashInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ valid: boolean; data?: StudentCertificate } | null>(null);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (activeTab === 'LOGS') loadLogs();
  }, [activeTab]);

  useEffect(() => {
    if (!isScanning) return;
    const timer = setTimeout(() => {
      const element = document.getElementById("qr-reader");
      if (element && !scannerRef.current) {
        try {
          const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, showTorchButtonIfSupported: true }, false);
          scannerRef.current = scanner;
          scanner.render((decodedText) => { handleScanSuccess(decodedText); }, (_error) => {});
        } catch (e) { console.error("Failed to initialize scanner", e); setIsScanning(false); }
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try { scannerRef.current.clear().catch(err => console.warn("Cleanup clear error", err)); } catch (e) { console.warn("Scanner cleanup failed", e); }
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleScanSuccess = async (decodedText: string) => {
    setHashInput(decodedText);
    if (scannerRef.current) {
      try { await scannerRef.current.clear(); scannerRef.current = null; } catch (e) { console.error("Failed to clear scanner on success", e); }
    }
    setIsScanning(false);
    triggerVerification(decodedText);
  };

  const handleStopScanning = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.clear(); scannerRef.current = null; } catch (e) { console.error("Failed to clear scanner on stop", e); }
    }
    setIsScanning(false);
  };

  const loadLogs = async () => {
    const data = await blockchainService.getVerificationLogs(user.walletAddress);
    setLogs(data);
  };

  const triggerVerification = async (hash: string) => {
    if (!hash) return;
    setIsVerifying(true);
    setResult(null);
    try {
      const cert = await blockchainService.verifyCertificate(hash.trim(), user.walletAddress);
      if (cert) { setResult({ valid: true, data: cert }); } else { setResult({ valid: false }); }
    } catch (error) { setResult({ valid: false }); } finally { setIsVerifying(false); }
  };

  const handleVerify = (e: React.FormEvent) => { e.preventDefault(); triggerVerification(hashInput); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setFileError(null);
    setResult(null);
    try {
      let decodedText: string | null = null;
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        try {
          const meta = await pdf.getMetadata();
          const subject = (meta?.info as any)?.Subject || '';
          const metaMatch = subject.match(/CERT_HASH:(0x[a-fA-F0-9]+)/);
          if (metaMatch) decodedText = metaMatch[1];
        } catch (_) {}
        if (!decodedText) {
          try {
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const fullText = textContent.items.map((item: any) => item.str).join(' ');
            const textMatch = fullText.match(/CERT_HASH:(0x[a-fA-F0-9]+)/);
            if (textMatch) decodedText = textMatch[1];
          } catch (_) {}
        }
        if (!decodedText) {
          const jsQR: any = await new Promise((resolve) => {
            if ((window as any).jsQR) return resolve((window as any).jsQR);
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js';
            s.onload = () => resolve((window as any).jsQR ?? null);
            s.onerror = () => resolve(null);
            document.head.appendChild(s);
          });
          if (jsQR) {
            const QR_X_MM = 137.1, QR_Y_MM = 223.4, QR_SIZE_MM = 45, A4_W_MM = 210, A4_H_MM = 297;
            const decodeCanvas = (c: HTMLCanvasElement): string | null => {
              const ctx = c.getContext('2d'); if (!ctx) return null;
              const d = ctx.getImageData(0,0,c.width,c.height);
              const r = jsQR(d.data,c.width,c.height,{inversionAttempts:'attemptBoth'});
              return r ? r.data : null;
            };
            const cropQR = (page: HTMLCanvasElement): HTMLCanvasElement => {
              const sx=page.width/A4_W_MM,sy=page.height/A4_H_MM,pad=1.5;
              const qw=QR_SIZE_MM*sx*pad,qh=QR_SIZE_MM*sy*pad;
              const qx=QR_X_MM*sx-(qw-QR_SIZE_MM*sx)/2,qy=QR_Y_MM*sy-(qh-QR_SIZE_MM*sy)/2;
              const c=document.createElement('canvas'); c.width=Math.ceil(qw); c.height=Math.ceil(qh);
              const ctx=c.getContext('2d'); if(ctx) ctx.drawImage(page,qx,qy,qw,qh,0,0,c.width,c.height);
              return c;
            };
            const upscale = (src: HTMLCanvasElement, f: number): HTMLCanvasElement => {
              const c=document.createElement('canvas'); c.width=src.width*f; c.height=src.height*f;
              const ctx=c.getContext('2d'); if(ctx){ctx.imageSmoothingEnabled=false;ctx.drawImage(src,0,0,c.width,c.height);}
              return c;
            };
            const tryDecode = (src: HTMLCanvasElement): string | null => decodeCanvas(src)||decodeCanvas(upscale(src,3))||decodeCanvas(upscale(src,5));
            const arrayBuffer2 = await file.arrayBuffer();
            const pdf2 = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;
            const page = await pdf2.getPage(1);
            for (const scale of [6,4,8,2]) {
              const vp=page.getViewport({scale});
              const pageCanvas=document.createElement('canvas'); pageCanvas.width=vp.width; pageCanvas.height=vp.height;
              const ctx=pageCanvas.getContext('2d'); if(!ctx) continue;
              await page.render({canvasContext:ctx,viewport:vp}).promise;
              decodedText=tryDecode(cropQR(pageCanvas));
              if(decodedText) break;
              decodedText=tryDecode(pageCanvas);
              if(decodedText) break;
            }
          }
        }
      }
      if (!decodedText && file.type.startsWith('image/')) {
        const jsQR: any = await new Promise((resolve) => {
          if ((window as any).jsQR) return resolve((window as any).jsQR);
          const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js';
          s.onload=()=>resolve((window as any).jsQR??null); s.onerror=()=>resolve(null); document.head.appendChild(s);
        });
        if (jsQR) {
          const img=new Image(); const url=URL.createObjectURL(file);
          await new Promise<void>((res,rej)=>{img.onload=()=>res();img.onerror=rej;img.src=url;}); URL.revokeObjectURL(url);
          const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
          const ctx=c.getContext('2d');
          if(ctx){ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height);const r=jsQR(d.data,c.width,c.height,{inversionAttempts:'attemptBoth'});if(r)decodedText=r.data;}
        }
      }
      if (decodedText) { setHashInput(decodedText); triggerVerification(decodedText); }
      else { setFileError("No QR code found. Please ensure the QR code is clearly visible, high-contrast, and not cut off."); }
    } catch (err) {
      console.error("File processing error:", err);
      setFileError("Failed to process the document. Please try a different file or use the camera.");
    } finally { setIsProcessingFile(false); e.target.value = ''; }
  };

  const cardGrad = 'linear-gradient(135deg,#f72585 0%,#f7971e 60%,#ffd200 100%)';

  return (
    <div style={{maxWidth:'860px',margin:'0 auto',padding:'40px 20px'}}>

      {/* Header Card */}
      <div style={{background:cardGrad,borderRadius:'20px',padding:'32px',marginBottom:'28px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'8px'}}>
          <div style={{background:'rgba(255,255,255,0.25)',borderRadius:'50%',width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <ShieldCheck style={{color:'white',width:'28px',height:'28px'}} />
          </div>
          <div>
            <h1 style={{fontSize:'1.5rem',fontWeight:800,color:'white',marginBottom:'4px'}}>Certificate Verification</h1>
            <p style={{color:'rgba(255,255,255,0.8)',fontSize:'0.85rem'}}>Verifier: {user.name} &nbsp;·&nbsp; {user.organization}</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{background:'rgba(255,255,255,0.97)',borderRadius:'20px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'}}>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'2px solid #f5f5f5'}}>
          {[['VERIFY','Verify Document'],['LOGS','Verification Logs']].map(([tab,label]) => (
            <button
              key={tab}
              onClick={()=>setActiveTab(tab as any)}
              style={{flex:1,padding:'16px',fontWeight:700,fontSize:'0.9rem',border:'none',cursor:'pointer',transition:'all 0.2s',
                background:activeTab===tab?'linear-gradient(135deg,#f72585,#f7971e)':'transparent',
                color:activeTab===tab?'white':'#888',
                borderBottom:activeTab===tab?'3px solid #f72585':'3px solid transparent'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{padding:'36px'}}>
          {activeTab === 'VERIFY' ? (
            <div style={{maxWidth:'560px',margin:'0 auto'}}>
              <div style={{textAlign:'center',marginBottom:'28px'}}>
                <h2 style={{fontSize:'1.8rem',fontWeight:800,color:'#1a1a1a',marginBottom:'8px'}}>Certificate Verification</h2>
                <p style={{color:'#888',fontSize:'0.9rem'}}>Instantly validate a certificate's authenticity on the blockchain.</p>
              </div>

              {/* Dashed divider */}
              <div style={{borderTop:'3px dashed #ff69b4',margin:'0 0 24px'}}></div>

              {isScanning ? (
                <div style={{marginBottom:'24px',background:'#f8f8f8',padding:'16px',borderRadius:'16px',border:'2px solid #eee'}}>
                  <div id="qr-reader" style={{width:'100%',overflow:'hidden',borderRadius:'10px',background:'white'}}></div>
                  <button onClick={handleStopScanning} style={{marginTop:'12px',width:'100%',padding:'12px',background:'white',border:'2px solid #ddd',borderRadius:'10px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',color:'#555'}}>
                    <X style={{width:'16px',height:'16px'}}/> Cancel Scan
                  </button>
                  <p style={{textAlign:'center',fontSize:'0.78rem',color:'#aaa',marginTop:'8px'}}>Point camera at the verification QR code</p>
                </div>
              ) : (
                <div>
                  {/* Scan / Upload Buttons */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'24px'}}>
                    <button
                      onClick={()=>setIsScanning(true)}
                      style={{padding:'20px',border:'2px solid rgba(247,37,133,0.3)',borderRadius:'14px',background:'rgba(247,37,133,0.06)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',fontWeight:700,color:'#c0306a',transition:'all 0.2s'}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(247,37,133,0.12)';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(247,37,133,0.6)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(247,37,133,0.06)';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(247,37,133,0.3)'}}
                    >
                      <div style={{background:'linear-gradient(135deg,#f72585,#f7971e)',borderRadius:'50%',width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Camera style={{color:'white',width:'22px',height:'22px'}} />
                      </div>
                      <span style={{fontSize:'0.9rem'}}>Scan with Camera</span>
                    </button>

                    <div style={{position:'relative'}}>
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isProcessingFile}
                        style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:10,width:'100%',height:'100%'}} />
                      <div style={{padding:'20px',border:'2px solid rgba(247,37,133,0.3)',borderRadius:'14px',background:'rgba(247,150,30,0.06)',display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',fontWeight:700,color:'#c07030',opacity:isProcessingFile?0.6:1,height:'100%',boxSizing:'border-box'}}>
                        <div style={{background:'linear-gradient(135deg,#f7971e,#ffd200)',borderRadius:'50%',width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {isProcessingFile ? <Loader2 style={{color:'white',width:'22px',height:'22px',animation:'spin 1s linear infinite'}} /> : <FileUp style={{color:'white',width:'22px',height:'22px'}} />}
                        </div>
                        <span style={{fontSize:'0.9rem'}}>{isProcessingFile ? 'Processing...' : 'Upload QR Image'}</span>
                      </div>
                    </div>
                  </div>

                  {/* OR divider */}
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                    <div style={{flex:1,height:'1px',background:'#e0e0e0'}}></div>
                    <span style={{fontSize:'0.78rem',fontWeight:700,color:'#aaa',letterSpacing:'1px'}}>OR ENTER MANUALLY</span>
                    <div style={{flex:1,height:'1px',background:'#e0e0e0'}}></div>
                  </div>

                  {/* Hash Input + Verify */}
                  <form onSubmit={handleVerify} style={{marginBottom:'8px'}}>
                    <input
                      type="text"
                      value={hashInput}
                      onChange={(e)=>setHashInput(e.target.value)}
                      placeholder="Enter Certificate Hash (e.g., 0x...)"
                      style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'2px solid #e0e0e0',fontSize:'0.9rem',outline:'none',fontFamily:'monospace',marginBottom:'12px',boxSizing:'border-box',background:'rgba(247,37,133,0.03)'}}
                    />
                    <button
                      type="submit"
                      disabled={isVerifying||!hashInput}
                      style={{width:'100%',padding:'15px',background:isVerifying||!hashInput?'#ccc':'white',border:`2px solid ${isVerifying||!hashInput?'#ccc':'#f72585'}`,borderRadius:'12px',fontWeight:800,fontSize:'1rem',cursor:isVerifying||!hashInput?'not-allowed':'pointer',color:isVerifying||!hashInput?'#999':'#f72585',transition:'all 0.2s'}}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                    </button>
                  </form>

                  {fileError && <p style={{textAlign:'center',color:'#e53e3e',fontSize:'0.85rem',marginTop:'12px'}}>{fileError}</p>}
                </div>
              )}

              {/* Return to home link */}
              <div style={{textAlign:'center',marginTop:'20px'}}>
                <span style={{color:'#aaa',fontSize:'0.85rem',fontWeight:500,cursor:'pointer'}} onClick={()=>{}}>Return to Home Page</span>
              </div>

              {/* Result */}
              {result && (
                <div style={{marginTop:'24px',borderRadius:'16px',padding:'24px',border:`2px solid ${result.valid?'#c6f6d5':'#fed7d7'}`,background:result.valid?'rgba(198,246,213,0.3)':'rgba(254,215,215,0.3)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:'16px'}}>
                    <div style={{background:result.valid?'#c6f6d5':'#fed7d7',borderRadius:'50%',padding:'12px',flexShrink:0}}>
                      {result.valid
                        ? <ShieldCheck style={{color:'#276749',width:'28px',height:'28px'}} />
                        : <ShieldAlert style={{color:'#c53030',width:'28px',height:'28px'}} />}
                    </div>
                    <div style={{flex:1}}>
                      {/* Green success banner */}
                      {result.valid && (
                        <div style={{background:'linear-gradient(90deg,#38a169,#48bb78)',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',textAlign:'center'}}>
                          <span style={{color:'white',fontWeight:800,fontSize:'1rem'}}>✓ Verification Successful</span>
                        </div>
                      )}
                      <h3 style={{fontSize:'1.1rem',fontWeight:800,color:result.valid?'#276749':'#c53030',marginBottom:'6px'}}>
                        {result.valid ? 'Certificate is VALID' : 'Certificate is INVALID'}
                      </h3>
                      <p style={{fontSize:'0.85rem',color:result.valid?'#2f855a':'#c53030',marginBottom:'16px'}}>
                        {result.valid ? 'This document is authentically signed and present on the blockchain.' : 'No matching record found. The hash may be incorrect or the document forged.'}
                      </p>
                      {result.valid && result.data && (
                        <div style={{background:'white',borderRadius:'12px',padding:'16px',border:'1px solid rgba(56,161,105,0.2)'}}>
                          <p style={{fontWeight:800,color:'#1a1a1a',fontSize:'1rem',marginBottom:'16px'}}>Verified Certificate Details</p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                            {[
                              ['Student Name',result.data.studentName],
                              ['Roll No',result.data.studentId],
                              ['Department',result.data.course],
                              ['Year of Pass',result.data.year],
                              ['Date Issued',new Date(result.data.issueDate).toLocaleString(),'full'],
                            ].map(([label,val,full])=>(
                              <div key={label as string} style={full?{gridColumn:'1/-1'}:{}}>
                                <p style={{fontSize:'0.78rem',color:'#888',marginBottom:'2px'}}>{label}:</p>
                                <p style={{fontWeight:600,color:'#1a1a1a',fontSize:'0.9rem'}}>{val}</p>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg,#f72585,#f7971e)'}}>
                    {['Time','Hash Queried','Status'].map((h,i)=>(
                      <th key={i} style={{padding:'14px 20px',color:'white',fontWeight:700,textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log,i) => (
                    <tr key={log.id} style={{borderBottom:'1px solid #f0f0f0',background:i%2===0?'white':'#fafafa'}}>
                      <td style={{padding:'13px 20px',color:'#444'}}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{padding:'13px 20px',fontFamily:'monospace',fontSize:'0.8rem',color:'#666'}}>{log.certificateHash.substring(0,16)}...</td>
                      <td style={{padding:'13px 20px'}}>
                        <span style={{display:'inline-block',padding:'4px 12px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:700,background:log.isValid?'#c6f6d5':'#fed7d7',color:log.isValid?'#276749':'#c53030'}}>
                          {log.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={3} style={{padding:'48px',textAlign:'center',color:'#aaa'}}>No verification history yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
