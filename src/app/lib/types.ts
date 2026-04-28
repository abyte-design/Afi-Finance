export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  currency: string;
  biometricEnabled: boolean;
  cloudSyncEnabled: boolean;
  avatarUrl?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: { name: string };
}