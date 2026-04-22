export type UserRole = 'ADMIN' | 'VERIFIER' | 'STUDENT';

export interface UserProfile {
  walletAddress: string;
  name: string;
  role: UserRole;
  organization?: string; // For Admin/Verifier
  studentId?: string;    // For Student
  joinedDate: number;
}

export interface QrConfig {
  x: number;
  y: number;
  size: number;
}

export interface StudentCertificate {
  certificateId: string; // Unique ID
  studentId: string;
  studentName: string;
  course: string;
  year: string;
  issuerId: string; // Wallet address of admin
  issuerName: string;
  issueDate: number;
  certificateHash: string;
  ipfsLink?: string; 
  templateImage?: string; // Base64 of the background template
  qrConfig?: QrConfig; // Position of QR code
}

export interface VerificationLog {
  id: string;
  verifierId: string;
  certificateHash: string;
  timestamp: number;
  isValid: boolean;
  notes?: string;
}

export interface StudentUpload {
  id: string;
  studentId: string;
  title: string;
  category: 'INTERNSHIP' | 'WORKSHOP' | 'COURSE' | 'OTHER';
  issuer: string;
  date: string;
  description: string;
  timestamp: number;
}