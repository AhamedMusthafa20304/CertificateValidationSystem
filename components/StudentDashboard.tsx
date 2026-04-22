import React, { useState, useEffect } from 'react';
import { GraduationCap, Calendar, Download, Loader2, Award, Plus, FileText, Copy, Check, Key, X } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { StudentCertificate, StudentUpload, UserProfile } from '../types';
import QRCode from 'qrcode';

interface StudentDashboardProps {
  user: UserProfile;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url; img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img); img.onerror = (e) => reject(e);
  });
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'PORTFOLIO'>('OFFICIAL');
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [uploads, setUploads] = useState<StudentUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title:'', issuer:'', category:'COURSE', date:'', description:'' });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    if (activeTab === 'OFFICIAL') {
      const data = await blockchainService.getStudentCertificates(user.studentId || '');
      setCerts(data);
    } else {
      const data = await blockchainService.getStudentUploads(user.studentId || '');
      setUploads(data);
    }
    setIsLoading(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.studentId) return;
    await blockchainService.uploadStudentDocument({ studentId: user.studentId, title: uploadForm.title, issuer: uploadForm.issuer, category: uploadForm.category as any, date: uploadForm.date, description: uploadForm.description });
    setShowUploadModal(false);
    loadData();
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedHash(text); setTimeout(() => setCopiedHash(null), 2000); } catch (err) { console.error('Failed to copy:', err); }
  };

  const generatePDF = async (cert: StudentCertificate) => {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: cert.studentName, course: cert.course, issuerName: cert.issuerName, certificateHash: cert.certificateHash, templateBase64: cert.templateImage, qrConfig: cert.qrConfig }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF from backend');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${cert.studentId}_${cert.course.replace(/\s+/g,'_')}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert("Failed to generate PDF via backend."); } finally { setIsGeneratingPdf(false); }
  };

  const cardGrad = 'linear-gradient(135deg,#e63946 0%,#f4a261 60%,#ffd166 100%)';

  return (
    <div style={{maxWidth:'1000px',margin:'0 auto',padding:'40px 20px'}}>

      {/* Header */}
      <div style={{background:cardGrad,borderRadius:'20px',padding:'32px',marginBottom:'28px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{background:'rgba(255,255,255,0.25)',borderRadius:'50%',width:'64px',height:'64px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <GraduationCap style={{color:'white',width:'32px',height:'32px'}} />
            </div>
            <div>
              <h2 style={{fontSize:'1.6rem',fontWeight:800,color:'white',marginBottom:'4px'}}>{user.name}</h2>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                <span style={{background:'rgba(255,255,255,0.2)',borderRadius:'8px',padding:'3px 10px',color:'rgba(255,255,255,0.9)',fontSize:'0.82rem',fontWeight:600}}>ID: {user.studentId}</span>
                <span style={{color:'rgba(255,255,255,0.7)',fontSize:'0.8rem',fontFamily:'monospace'}}>{user.walletAddress.substring(0,10)}...</span>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:'24px'}}>
            {certs.length > 0 && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:'2rem',fontWeight:800,color:'white',lineHeight:1}}>{certs.length}</p>
                <p style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',fontWeight:600,textTransform:'uppercase',marginTop:'2px'}}>Verified</p>
              </div>
            )}
            {uploads.length > 0 && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:'2rem',fontWeight:800,color:'white',lineHeight:1}}>{uploads.length}</p>
                <p style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',fontWeight:600,textTransform:'uppercase',marginTop:'2px'}}>Uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'0',marginBottom:'28px',background:'rgba(255,255,255,0.15)',borderRadius:'14px',padding:'4px'}}>
        {[['OFFICIAL','Blockchain Credentials'],['PORTFOLIO','Self-Reported Portfolio']].map(([tab,label])=>(
          <button
            key={tab}
            onClick={()=>setActiveTab(tab as any)}
            style={{flex:1,padding:'12px 20px',border:'none',borderRadius:'11px',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',transition:'all 0.2s',
              background:activeTab===tab?'white':'transparent',
              color:activeTab===tab?'#c0306a':'rgba(255,255,255,0.85)',
              boxShadow:activeTab===tab?'0 4px 12px rgba(0,0,0,0.1)':'none'
            }}
          >{label}</button>
        ))}
      </div>

      {isLoading ? (
        <div style={{padding:'80px',textAlign:'center'}}>
          <Loader2 style={{width:'36px',height:'36px',color:'white',animation:'spin 1s linear infinite',margin:'0 auto'}} />
        </div>
      ) : activeTab === 'OFFICIAL' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'20px'}}>
          {certs.map(cert => (
            <div key={cert.certificateHash} style={{background:'rgba(255,255,255,0.97)',borderRadius:'18px',padding:'24px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',transition:'transform 0.2s,box-shadow 0.2s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.18)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.12)'}}
            >
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
                <div style={{background:'linear-gradient(135deg,#e63946,#f4a261)',borderRadius:'12px',padding:'10px'}}>
                  <GraduationCap style={{color:'white',width:'24px',height:'24px'}} />
                </div>
                <span style={{background:'#dcfce7',color:'#16a34a',fontSize:'0.72rem',fontWeight:800,padding:'4px 10px',borderRadius:'20px',textTransform:'uppercase',letterSpacing:'0.5px'}}>✓ Verified</span>
              </div>
              <h3 style={{fontSize:'1.3rem',fontWeight:800,color:'#1a1a1a',marginBottom:'6px',textTransform:'capitalize'}}>{cert.course}</h3>
              <p style={{fontSize:'0.85rem',color:'#666',marginBottom:'16px'}}>{cert.issuerName} · Class of {cert.year}</p>

              <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f8f8f8',padding:'10px 12px',borderRadius:'10px',marginBottom:'16px',border:'1px solid #eee'}}>
                <Key style={{color:'#aaa',width:'14px',height:'14px',flexShrink:0}} />
                <span style={{flex:1,fontFamily:'monospace',fontSize:'0.72rem',color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  Hash: {cert.certificateHash}
                </span>
                <button onClick={()=>copyToClipboard(cert.certificateHash)} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:copiedHash===cert.certificateHash?'#16a34a':'#aaa'}}>
                  {copiedHash===cert.certificateHash ? <Check style={{width:'14px',height:'14px'}}/> : <Copy style={{width:'14px',height:'14px'}}/>}
                </button>
              </div>

              <button onClick={()=>generatePDF(cert)} disabled={isGeneratingPdf}
                style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#e63946,#f4a261)',border:'none',borderRadius:'12px',color:'white',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:isGeneratingPdf?0.7:1}}
              >
                {isGeneratingPdf ? <Loader2 style={{width:'16px',height:'16px',animation:'spin 1s linear infinite'}}/> : <Download style={{width:'16px',height:'16px'}}/>}
                {isGeneratingPdf ? 'Generating...' : 'Download Certificate'}
              </button>
            </div>
          ))}
          {certs.length===0 && (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'64px',background:'rgba(255,255,255,0.15)',borderRadius:'16px',border:'2px dashed rgba(255,255,255,0.4)'}}>
              <p style={{color:'rgba(255,255,255,0.7)',fontSize:'0.95rem'}}>No official certificates found.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <h3 style={{fontSize:'1.2rem',fontWeight:800,color:'white'}}>My External Achievements</h3>
            <button onClick={()=>setShowUploadModal(true)}
              style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'rgba(255,255,255,0.25)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',color:'white',fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}}
            >
              <Plus style={{width:'16px',height:'16px'}}/> Add New
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {uploads.map(item=>(
              <div key={item.id} style={{background:'rgba(255,255,255,0.97)',borderRadius:'14px',padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px',boxShadow:'0 2px 12px rgba(0,0,0,0.1)'}}>
                <div style={{background:'linear-gradient(135deg,#e63946,#f4a261)',borderRadius:'10px',padding:'10px',flexShrink:0}}>
                  <FileText style={{color:'white',width:'20px',height:'20px'}} />
                </div>
                <div style={{flex:1}}>
                  <h4 style={{fontWeight:700,color:'#1a1a1a',marginBottom:'3px'}}>{item.title}</h4>
                  <p style={{fontSize:'0.82rem',color:'#888'}}>{item.issuer} · {item.date}</p>
                </div>
                <span style={{background:'#f0f0f0',color:'#555',fontSize:'0.72rem',fontWeight:700,padding:'4px 10px',borderRadius:'20px',textTransform:'uppercase'}}>{item.category}</span>
              </div>
            ))}
            {uploads.length===0 && (
              <div style={{textAlign:'center',padding:'48px',background:'rgba(255,255,255,0.15)',borderRadius:'16px',border:'2px dashed rgba(255,255,255,0.4)'}}>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:'0.95rem'}}>Upload your internships, workshops, and other certs here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'20px'}}>
          <div style={{background:'white',borderRadius:'20px',maxWidth:'440px',width:'100%',padding:'28px',position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <button onClick={()=>setShowUploadModal(false)} style={{position:'absolute',top:'16px',right:'16px',background:'#f5f5f5',border:'none',borderRadius:'8px',padding:'6px',cursor:'pointer'}}>
              <X style={{width:'16px',height:'16px',color:'#555'}} />
            </button>
            <h3 style={{fontSize:'1.2rem',fontWeight:800,color:'#1a1a1a',marginBottom:'20px'}}>Add Achievement</h3>
            <form onSubmit={handleUploadSubmit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {[['Title','text','title'],['Issuer','text','issuer'],['Date','text','date']].map(([label,type,field])=>(
                <div key={field}>
                  <label style={{display:'block',fontWeight:600,fontSize:'0.82rem',color:'#444',marginBottom:'5px'}}>{label}</label>
                  <input type={type} required={field!=='date'} value={(uploadForm as any)[field]} onChange={e=>setUploadForm({...uploadForm,[field]:e.target.value})}
                    style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'2px solid #e0e0e0',outline:'none',fontSize:'0.9rem',boxSizing:'border-box'}} />
                </div>
              ))}
              <div>
                <label style={{display:'block',fontWeight:600,fontSize:'0.82rem',color:'#444',marginBottom:'5px'}}>Category</label>
                <select value={uploadForm.category} onChange={e=>setUploadForm({...uploadForm,category:e.target.value})}
                  style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'2px solid #e0e0e0',outline:'none',fontSize:'0.9rem',boxSizing:'border-box'}}>
                  <option value="COURSE">Course</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                <button type="button" onClick={()=>setShowUploadModal(false)} style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'10px',fontWeight:700,cursor:'pointer',background:'white',color:'#555'}}>Cancel</button>
                <button type="submit" style={{flex:1,padding:'12px',background:'linear-gradient(135deg,#e63946,#f4a261)',border:'none',borderRadius:'10px',fontWeight:700,cursor:'pointer',color:'white'}}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
