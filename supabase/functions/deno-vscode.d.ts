declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

// Only declare Deno when the real Deno types aren't loaded (e.g. plain VS Code
// without the Deno extension). When Deno's own checker runs, it already
// provides the `Deno` namespace and redeclaring it here causes TS2451.
// @ts-ignore - intentional fallback shim for editor-only type checking
declare const Deno: typeof globalThis extends { Deno: infer D } ? D : {
  env: { get(key: string): string | undefined };
};