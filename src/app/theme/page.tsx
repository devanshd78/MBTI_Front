// app/theme/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GateSelection from '@/components/GateSelection';

export default function Page() {
  const sp = useSearchParams();
  const router = useRouter();
  const name = sp.get('name')?.trim() || '';

  useEffect(() => {
    if (!name) router.replace('/');
  }, [name, router]);

  if (!name) return null;

  return <GateSelection />;
}
  