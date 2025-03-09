import { FieldValue } from 'firebase/firestore';

export type UserRole = 'superadmin' | 'admin' | 'scholar' | 'user';

export const SUPER_ADMIN_EMAIL = 'rileyjadamson@gmail.com';

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface WorkHistoryItem {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface AcademicHistoryItem {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}

interface Achievement {
  title: string;
  date: string;
  description: string;
}

interface Product {
  title: string;
  description: string;
  url?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number | FieldValue;
  updatedAt: number | FieldValue;
  bio: string;
  academicHistory: AcademicHistoryItem[];
  workHistory: WorkHistoryItem[];
  achievements: Achievement[];
  websites: string[];
  socialMedia: SocialMediaLink[];
  products: Product[];
}

export function canManageAdmins(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return userProfile.email === SUPER_ADMIN_EMAIL;
}

export function canManageScholars(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return ['superadmin', 'admin'].includes(userProfile.role);
}

export function canAddCommentary(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return ['superadmin', 'admin', 'scholar'].includes(userProfile.role);
}

export const DEFAULT_USER_ROLE: UserRole = 'user'; 