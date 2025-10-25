'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ThemeAssessment from '@/components/ThemeAssessment';
import { useRouteLoader } from '@/components/RouterLoader';

export default function Page() {
  const { themeId } = useParams<{ themeId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const routeLoader = useRouteLoader();
  const name = sp.get('name')?.trim() || '';

  useEffect(() => {
    if (!themeId) router.replace('/theme');
    routeLoader.stop();
  }, [themeId, router, routeLoader]);

  if (!themeId) return null;

  return (
    <ThemeAssessment
      themeId={themeId}
      userName={name}
      onComplete={(rid, fallbackType) => {
        routeLoader.start();
        const q = new URLSearchParams();
        if (name) q.set('name', name);
        if (rid) q.set('rid', rid);
        else if (fallbackType) q.set('type', fallbackType);
        router.push(`/result?${q.toString()}`);
      }}
    />
  );
}
