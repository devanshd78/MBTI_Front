import type { ReactNode } from 'react';
import AdminShell from './components/adminShell';

export const metadata = {
  title: 'Admin',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
