// Shared CORS helpers for Lovable edge functions.

const DEFAULT_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export interface CorsOptions {
  allowOrigin?: string;
  allowHeaders?: string;
  allowMethods?: string;
}

export function buildCorsHeaders(_req: Request, opts: CorsOptions = {}): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": opts.allowOrigin ?? "*",
    "Access-Control-Allow-Headers": opts.allowHeaders ?? DEFAULT_ALLOW_HEADERS,
    "Access-Control-Allow-Methods": opts.allowMethods ?? "GET, POST, PUT, DELETE, OPTIONS",
  };
}

export function corsPreflight(req: Request, opts: CorsOptions = {}): Response {
  return new Response(null, { status: 204, headers: buildCorsHeaders(req, opts) });
}
