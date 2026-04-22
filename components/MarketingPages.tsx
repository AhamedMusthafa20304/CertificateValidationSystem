import React from 'react';
import { ShieldCheck, Database, QrCode, Zap, Lock, Globe, CheckCircle, ArrowRight, Server, FileCheck, Users, Mail, GraduationCap, Building2 } from 'lucide-react';

interface PageProps {
  onNavigate: (page: string, role?: string) => void;
}

const cardGradients = [
  'linear-gradient(135deg, #f72585 0%, #e85d04 60%, #faa307 100%)',
  'linear-gradient(135deg, #f72585 0%, #d62828 50%, #f77f00 100%)',
  'linear-gradient(135deg, #e63946 0%, #f4a261 60%, #ffd166 100%)',
];

export const LandingPage: React.FC<PageProps> = ({ onNavigate }) => (
  <div style={{minHeight:'calc(100vh - 130px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>
    <h1 style={{fontSize:'2.8rem',fontWeight:800,color:'white',marginBottom:'48px',textAlign:'center',textShadow:'0 2px 20px rgba(0,0,0,0.15)',letterSpacing:'-0.5px'}}>
      Access Your Portal
    </h1>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'24px',width:'100%',maxWidth:'1000px'}}>
      {/* Admin Panel */}
      <div
        style={{background:cardGradients[0],borderRadius:'20px',padding:'40px 32px',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 48px rgba(0,0,0,0.25)'}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.18)'}}
        onClick={() => onNavigate('dashboard','ADMIN')}
      >
        <div style={{background:'rgba(255,255,255,0.25)',borderRadius:'50%',width:'64px',height:'64px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'20px'}}>
          <Building2 style={{color:'white',width:'32px',height:'32px'}} />
        </div>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'white',marginBottom:'12px'}}>Admin Panel</h2>
        <p style={{color:'rgba(255,255,255,0.85)',lineHeight:1.6,fontSize:'0.95rem',marginBottom:'28px'}}>
          Issue certificates, upload documents, and manage student accounts.
        </p>
        <button
          style={{background:'rgba(255,255,255,0.22)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',padding:'12px 24px',color:'white',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.35)'}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.22)'}
        >
          Enter Admin <ArrowRight style={{width:'16px',height:'16px'}} />
        </button>
      </div>

      {/* Verifier */}
      <div
        style={{background:cardGradients[1],borderRadius:'20px',padding:'40px 32px',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 48px rgba(0,0,0,0.25)'}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.18)'}}
        onClick={() => onNavigate('dashboard','VERIFIER')}
      >
        <div style={{background:'rgba(255,255,255,0.25)',borderRadius:'50%',width:'64px',height:'64px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'20px'}}>
          <ShieldCheck style={{color:'white',width:'32px',height:'32px'}} />
        </div>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'white',marginBottom:'12px'}}>Verifier</h2>
        <p style={{color:'rgba(255,255,255,0.85)',lineHeight:1.6,fontSize:'0.95rem',marginBottom:'28px'}}>
          Verify the authenticity of a certificate using its cryptographic hash or QR code.
        </p>
        <button
          style={{background:'rgba(255,255,255,0.22)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',padding:'12px 24px',color:'white',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.35)'}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.22)'}
        >
          Enter Verifier <ArrowRight style={{width:'16px',height:'16px'}} />
        </button>
      </div>

      {/* Student Portal */}
      <div
        style={{background:cardGradients[2],borderRadius:'20px',padding:'40px 32px',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 48px rgba(0,0,0,0.25)'}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.18)'}}
        onClick={() => onNavigate('dashboard','STUDENT')}
      >
        <div style={{background:'rgba(255,255,255,0.25)',borderRadius:'50%',width:'64px',height:'64px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'20px'}}>
          <GraduationCap style={{color:'white',width:'32px',height:'32px'}} />
        </div>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'white',marginBottom:'12px'}}>Student Portal</h2>
        <p style={{color:'rgba(255,255,255,0.85)',lineHeight:1.6,fontSize:'0.95rem',marginBottom:'28px'}}>
          Log in to view, download, and share your officially issued certificates.
        </p>
        <button
          style={{background:'rgba(255,255,255,0.22)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',padding:'12px 24px',color:'white',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.35)'}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.22)'}
        >
          Enter Student <ArrowRight style={{width:'16px',height:'16px'}} />
        </button>
      </div>
    </div>
  </div>
);

export const FeaturesPage: React.FC = () => (
  <div style={{maxWidth:'1000px',margin:'0 auto',padding:'60px 24px'}}>
    <div style={{textAlign:'center',marginBottom:'48px'}}>
      <h2 style={{fontSize:'2rem',fontWeight:800,color:'white',marginBottom:'12px'}}>Why Blockchain Validation?</h2>
      <p style={{color:'rgba(255,255,255,0.8)',maxWidth:'500px',margin:'0 auto'}}>Traditional paper certificates are easily forged. Our decentralized solution offers a superior alternative.</p>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'20px'}}>
      {[
        {icon:<Lock className="w-7 h-7 text-white"/>,title:'Secure Storage',desc:'Certificates are hashed using SHA-256 and stored on an immutable blockchain ledger.'},
        {icon:<CheckCircle className="w-7 h-7 text-white"/>,title:'Tamper-Proof',desc:'Once issued, records cannot be altered or deleted by anyone, ensuring absolute integrity.'},
        {icon:<QrCode className="w-7 h-7 text-white"/>,title:'Instant Verification',desc:'Verifiers can scan a QR code to instantly check the authenticity of any document.'},
        {icon:<Zap className="w-7 h-7 text-white"/>,title:'Real-Time Validation',desc:'No manual backend checks needed. The smart contract validates data in milliseconds.'},
        {icon:<Globe className="w-7 h-7 text-white"/>,title:'Global Access',desc:'Certificates can be verified from anywhere in the world without third-party dependency.'},
        {icon:<Database className="w-7 h-7 text-white"/>,title:'Decentralized',desc:'No single point of failure. Data is distributed across the blockchain network.'},
      ].map((f,i) => (
        <div key={i} style={{background:'linear-gradient(135deg,rgba(247,37,133,0.85),rgba(232,93,4,0.85))',borderRadius:'16px',padding:'28px 24px',backdropFilter:'blur(8px)'}}>
          <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'12px',width:'48px',height:'48px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>{f.icon}</div>
          <h3 style={{fontSize:'1.1rem',fontWeight:700,color:'white',marginBottom:'8px'}}>{f.title}</h3>
          <p style={{color:'rgba(255,255,255,0.85)',fontSize:'0.9rem',lineHeight:1.6}}>{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export const HowItWorksPage: React.FC = () => (
  <div style={{maxWidth:'900px',margin:'0 auto',padding:'60px 24px'}}>
    <div style={{textAlign:'center',marginBottom:'48px'}}>
      <h2 style={{fontSize:'2rem',fontWeight:800,color:'white',marginBottom:'12px'}}>How It Works</h2>
      <p style={{color:'rgba(255,255,255,0.8)'}}>A seamless process for institutions, students, and verifiers.</p>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'20px'}}>
      {[
        {step:'01',title:'Issue',desc:'Institution uploads certificate details & file.'},
        {step:'02',title:'Hash',desc:'System generates a unique SHA-256 digital fingerprint.'},
        {step:'03',title:'Store',desc:'Hash is stored permanently on the Blockchain.'},
        {step:'04',title:'Verify',desc:'Employers scan QR to match hash against the chain.'},
      ].map((item,i) => (
        <div key={i} style={{background:'linear-gradient(135deg,rgba(247,37,133,0.85),rgba(232,93,4,0.85))',borderRadius:'16px',padding:'28px 20px',textAlign:'center'}}>
          <div style={{width:'48px',height:'48px',background:'rgba(255,255,255,0.3)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'1rem',fontWeight:800,color:'white'}}>{item.step}</div>
          <h3 style={{fontSize:'1.1rem',fontWeight:700,color:'white',marginBottom:'8px'}}>{item.title}</h3>
          <p style={{color:'rgba(255,255,255,0.85)',fontSize:'0.85rem',lineHeight:1.5}}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export const AboutPage: React.FC = () => (
  <div style={{maxWidth:'800px',margin:'0 auto',padding:'60px 24px'}}>
    <h2 style={{fontSize:'2rem',fontWeight:800,color:'white',marginBottom:'24px'}}>About the System</h2>
    <div style={{background:'linear-gradient(135deg,rgba(247,37,133,0.8),rgba(232,93,4,0.8))',borderRadius:'20px',padding:'40px',marginBottom:'24px'}}>
      <p style={{color:'white',lineHeight:1.8,fontSize:'1rem'}}>
        The <strong>CertiVerifier Student Certificate Validation System</strong> addresses the growing problem of educational certificate forgery.
        By leveraging blockchain technology, we create a decentralized trust layer that eliminates the need for manual background checks or third-party verification agencies.
      </p>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'20px'}}>
      {[
        {title:'Universities',desc:'To streamline issuance and protect reputation.'},
        {title:'Students',desc:'To have permanent, portable proof of achievement.'},
        {title:'Employers',desc:'To instantly verify candidate claims.'},
      ].map((item,i) => (
        <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'16px',padding:'24px',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)'}}>
          <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',marginBottom:'8px'}}>{item.title}</h3>
          <p style={{color:'rgba(255,255,255,0.8)',fontSize:'0.9rem'}}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export const ContactPage: React.FC = () => (
  <div style={{maxWidth:'520px',margin:'0 auto',padding:'60px 24px'}}>
    <div style={{textAlign:'center',marginBottom:'32px'}}>
      <h2 style={{fontSize:'2rem',fontWeight:800,color:'white',marginBottom:'8px'}}>Get in Touch</h2>
      <p style={{color:'rgba(255,255,255,0.8)'}}>Have questions about integrating CertiVerifier at your institution?</p>
    </div>
    <div style={{background:'linear-gradient(135deg,rgba(247,37,133,0.85),rgba(232,93,4,0.85))',borderRadius:'20px',padding:'36px'}}>
      <div style={{marginBottom:'20px'}}>
        <label style={{display:'block',color:'white',fontWeight:600,fontSize:'0.9rem',marginBottom:'8px'}}>Full Name</label>
        <input type="text" style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'2px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'white',fontSize:'0.95rem',outline:'none',boxSizing:'border-box'}} placeholder="John Doe" />
      </div>
      <div style={{marginBottom:'20px'}}>
        <label style={{display:'block',color:'white',fontWeight:600,fontSize:'0.9rem',marginBottom:'8px'}}>Email Address</label>
        <input type="email" style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'2px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'white',fontSize:'0.95rem',outline:'none',boxSizing:'border-box'}} placeholder="john@example.com" />
      </div>
      <div style={{marginBottom:'28px'}}>
        <label style={{display:'block',color:'white',fontWeight:600,fontSize:'0.9rem',marginBottom:'8px'}}>Message</label>
        <textarea rows={4} style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'2px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'white',fontSize:'0.95rem',outline:'none',boxSizing:'border-box',resize:'vertical'}} placeholder="How can we help?" />
      </div>
      <button style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.25)',border:'2px solid rgba(255,255,255,0.6)',borderRadius:'12px',color:'white',fontWeight:700,fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
        <Mail className="w-5 h-5" /> Send Message
      </button>
    </div>
  </div>
);
