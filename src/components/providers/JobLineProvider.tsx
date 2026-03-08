/**
 * src/components/providers/JobLineProvider.tsx
 *
 * Per CONTEXT.docx §7 Step 7:
 *   useJobLineRelay() is called exactly once — in JobLineProvider.
 *   Do not call it in any other component.
 *
 * Mount this provider once in the app layout (inside auth context).
 */

import { useJobLineRelay } from "@/hooks/useJobLineRelay";

interface JobLineProviderProps {
  children: React.ReactNode;
}

export function JobLineProvider({ children }: JobLineProviderProps) {
  useJobLineRelay(); // One instance, never more
  return <>{children}</>;
}
