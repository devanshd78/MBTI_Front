// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import WelcomePage from '@/components/WelcomePage';
import { useRouteLoader } from '@/components/RouterLoader';

export default function Page() {
  const router = useRouter();
  const routeLoader = useRouteLoader();

  return (
    <WelcomePage
      onNameSubmit={(name) => {
        routeLoader.start();
        router.push(`/theme?name=${encodeURIComponent(name)}`);
      }}
      scrollTargetId="themes"
    />
  );
}
