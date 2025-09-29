'use client';

import { PropsWithChildren } from 'react';

export const AuthGate = ({ children }: PropsWithChildren) => {
  // TODO: Wire up Supabase auth once available
  return <>{children}</>;
};
