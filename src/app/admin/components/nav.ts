import type { ReactNode } from 'react';
import {
  LayoutGrid, FolderKanban, HelpCircle, ClipboardList, Users, Settings,
  Brain, Database, LibraryBig
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: (props: any) => ReactNode;
  badge?: string | number;
};

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { label: 'Themes', href: '/admin/themes', icon: FolderKanban },
  { label: 'Questions', href: '/admin/questions', icon: HelpCircle },
  { label: 'Results', href: '/admin/results', icon: ClipboardList },
  { label: 'MBTI (Personality)', href: '/admin/mbti', icon: Brain },
];
