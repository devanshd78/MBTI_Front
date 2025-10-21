'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ResultPage from '@/components/ResultPage';
import { useRouteLoader } from '@/components/RouterLoader';
import { getApi } from '@/lib/api';
import type { MBTIResultPro } from '@/types/mbti';

type ApiOk<T> = { success: boolean; data: T; message?: string };

// Backend /results/:id shape (from your result.controller: getResultById)
type ResultById = {
  personality?: MBTIResultPro;
  name?: string;
  personalityType?: string;
  summary?: string;
};

export default function Page() {
  const sp = useSearchParams();
  const router = useRouter();
  const routeLoader = useRouteLoader();

  // Query params
  const userName = sp.get('name')?.trim() || '';
  const typeParam = sp.get('type')?.trim() || '';
  const type = typeParam.toUpperCase();
  const rid = sp.get('rid') || sp.get('resultId') || ''; // support ?rid= or ?resultId=

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MBTIResultPro | null>(null);

  useEffect(() => {
    routeLoader.stop();

    // must have either a result id (preferred) or a type
    if (!rid && !type) {
      router.replace('/');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        // 1) Prefer the stored backend result (includes personality)
        if (rid) {
          const json = await getApi<ApiOk<ResultById>>(`/results/${rid}`);
          if (cancelled) return;
          const personality = json?.data?.personality;
          if (personality) {
            setResult(personality);
            return;
          }
          // fall through to type if personality not present
        }

        // 2) Fallback: fetch profile by type from backend
        if (type) {
          const json = await getApi<ApiOk<MBTIResultPro>>(`/mbti/results/${type}`);
          if (cancelled) return;
          setResult(json.data);
          return;
        }

        // If neither worked, go home
        router.replace('/');
      } catch {
        router.replace('/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [type, rid, router, routeLoader]);

  if (loading || !result) return null;

  return (
    <ResultPage
      result={result}
      userName={userName}
      rid={rid}    
      onRetake={() => {
        try { localStorage.removeItem('selectedTheme'); } catch {}
        routeLoader.start();
        router.push('/');
      }}
    />
  );
}
