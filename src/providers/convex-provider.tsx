'use client';

import { ReactNode, useMemo, type ReactElement } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';

export function ConvexProvider({ children }: { children: ReactNode }): ReactElement {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210';
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  
  return (
    <ConvexAuthNextjsProvider client={client}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}