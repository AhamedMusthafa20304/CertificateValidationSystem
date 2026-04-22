import React, { useState } from 'react';
import { UserRole } from '../types';
import { ArrowRight, Loader2, KeyRound, Building2, User, ShieldCheck, GraduationCap, LayoutDashboard } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ id: '', password: '', institution: '' });
  const [verifierForm, setVerifierForm] = useState({ name: '', org: '' });
  const [studentForm, setStudentForm] = useState({ id: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let name = '', extraId = '';
      if (activeTab === 'ADMIN') {
        if (!adminForm.id || !adminForm.institution) { setIsLoading(false); setError('Please fill all fields.'); return; }
        name = adminForm.id; extraId = adminForm.institution;
      } else if (activeTab === 'VERIFIER') {
        if (!verifierForm.name) { setIsLoading(false); setError('Please enter your name.'); return; }
        name = verifierForm.name; extraId = verifierForm.org || 'Independent Verifier';
      } else {
        if (!studentForm.id) { setIsLoading(false); setError('Please enter your Student ID.'); return; }
        name = studentForm.id; extraId = studentForm.id;
      }
      const user = await blockchainService.login(activeTab, name, extraId);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { role: 'ADMIN' as UserRole, label: 'Admin', icon: <LayoutDashboard style={{ width: '18px', height: '18px' }} /> },
    { role: 'VERIFIER' as UserRole, label: 'Verifier', icon: <ShieldCheck style={{ width: '18px', height: '18px' }} /> },
    { role: 'STUDENT' as UserRole, label: 'Student', icon: <GraduationCap style={{ width: '18px', height: '18px' }} /> },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px 13px 44px', borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.2)',
    color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'linear-gradient(135deg,#f72585 0%,#e85d04 60%,#faa307 100%)',
    VERIFIER: 'linear-gradient(135deg,#f72585 0%,#f7971e 60%,#ffd200 100%)',
    STUDENT: 'linear-gradient(135deg,#e63946 0%,#f4a261 60%,#ffd166 100%)',
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 130px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', background: roleColors[activeTab] }}>

        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {activeTab === 'ADMIN' ? <LayoutDashboard style={{ color: 'white', width: '30px', height: '30px' }} /> : activeTab === 'VERIFIER' ? <ShieldCheck style={{ color: 'white', width: '30px', height: '30px' }} /> : <GraduationCap style={{ color: 'white', width: '30px', height: '30px' }} />}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '6px' }}>Welcome Back</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Select your role to access your portal</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', margin: '0 24px 24px', borderRadius: '12px', padding: '4px' }}>
          {tabs.map(({ role, label, icon }) => (
            <button key={role} onClick={() => { setActiveTab(role); setError(null); }}
              style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', background: activeTab === role ? 'rgba(255,255,255,0.9)' : 'transparent', color: activeTab === role ? '#c0306a' : 'rgba(255,255,255,0.8)' }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '0 24px 32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {activeTab === 'ADMIN' && (<>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Admin ID / Email</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="text" required value={adminForm.id} onChange={e => setAdminForm({ ...adminForm, id: e.target.value })} style={inputStyle} placeholder="admin@institution.edu" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="password" required value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} style={inputStyle} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Institution Name</label>
                <div style={{ position: 'relative' }}>
                  <Building2 style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="text" required value={adminForm.institution} onChange={e => setAdminForm({ ...adminForm, institution: e.target.value })} style={inputStyle} placeholder="University Name" />
                </div>
              </div>
            </>)}

            {activeTab === 'VERIFIER' && (<>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Verifier Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="text" required value={verifierForm.name} onChange={e => setVerifierForm({ ...verifierForm, name: e.target.value })} style={inputStyle} placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Organization <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <Building2 style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="text" value={verifierForm.org} onChange={e => setVerifierForm({ ...verifierForm, org: e.target.value })} style={inputStyle} placeholder="Company / HR" />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>No password required for public verification access.</p>
              </div>
            </>)}

            {activeTab === 'STUDENT' && (<>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Student ID</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="text" required value={studentForm.id} onChange={e => setStudentForm({ ...studentForm, id: e.target.value })} style={inputStyle} placeholder="e.g. ST-2024-001" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', width: '16px', height: '16px' }} />
                  <input type="password" required value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} style={inputStyle} placeholder="••••••••" />
                </div>
              </div>
            </>)}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,100,100,0.5)', borderRadius: '10px', color: 'white', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              style={{ width: '100%', padding: '15px', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '14px', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: isLoading ? 0.8 : 1, transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.38)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'}>
              {isLoading
                ? <><Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> Connecting...</>
                : <>{activeTab === 'VERIFIER' ? 'Access Verifier' : 'Connect'} <ArrowRight style={{ width: '18px', height: '18px' }} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '16px' }}>
            Your profile is saved to the server — the same account is restored on your next login.
          </p>
        </div>
      </div>
    </div>
  );
};
