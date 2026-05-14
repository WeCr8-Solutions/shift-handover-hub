// Shared AI safety + audit helpers (FedRAMP SI-3, SI-10, AU-2).
// Used by every edge function that calls the Lovable AI Gateway.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface PromptScreenResult {
  flagged: boolean;
  reasons: string[];
  /** Sanitized text — control chars stripped, length-capped. */
  sanitized: string;
  inputSha256: string;
}

const MAX_PROMPT_CHARS = 60_000;

const INJECTION_PATTERNS: Array<{ name: string; rx: RegExp }> = [
  { name: "ignore_previous_instructions", rx: /ignore (all |any |the )?(previous|above|prior|earlier) (instructions|prompts?|rules)/i },
  { name: "system_role_override",         rx: /\b(you are now|act as|pretend to be|roleplay as)\b.{0,40}\b(admin|developer|root|system|jailbroken|dan)\b/i },
  { name: "reveal_system_prompt",         rx: /(reveal|print|show|leak|repeat|output) (your |the )?(system|hidden|secret|initial) (prompt|instructions|rules)/i },
  { name: "tool_function_exfil",          rx: /(call|invoke|execute) (the )?(function|tool) ['"`]?(send_email|delete_|drop_|exec_|shell_)/i },
  { name: "credential_exfil",             rx: /(api[_\s-]?key|service[_\s-]?role|bearer token|supabase[_\s-]?url|env(ironment)? variables?)/i },
  { name: "ssrf_url_in_prompt",           rx: /\b(file:\/\/|gopher:\/\/|169\.254\.169\.254|metadata\.google\.internal|localhost:\d+)\b/i },
  { name: "prompt_separator_injection",   rx: /<\|(im_start|im_end|endoftext|system|assistant)\|>/i },
];

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Screens free-text prompt input for known injection / exfiltration patterns,
 * sanitizes (strip control chars, length cap), and produces a SHA-256 hash
 * for audit logging without storing the raw prompt.
 */
export async function screenPromptInjection(rawInput: string): Promise<PromptScreenResult> {
  const text = (rawInput ?? "").toString();
  // Strip control characters except newline / tab.
  // deno-lint-ignore no-control-regex
  const stripped = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const sanitized = stripped.length > MAX_PROMPT_CHARS ? stripped.slice(0, MAX_PROMPT_CHARS) : stripped;

  const reasons: string[] = [];
  for (const { name, rx } of INJECTION_PATTERNS) {
    if (rx.test(sanitized)) reasons.push(name);
  }
  if (stripped.length > MAX_PROMPT_CHARS) reasons.push("prompt_too_long_truncated");

  return {
    flagged: reasons.length > 0,
    reasons,
    sanitized,
    inputSha256: await sha256Hex(sanitized),
  };
}

export interface AiRequestLogEntry {
  organizationId: string | null;
  userId: string | null;
  functionName: string;
  model: string | null;
  inputLength: number;
  outputLength: number;
  inputSha256: string | null;
  flagged: boolean;
  flagReasons: string[];
  latencyMs: number | null;
  status: "ok" | "blocked" | "error" | "rate_limited" | "credits_exhausted";
  errorMessage?: string | null;
}

/**
 * Append-only AI audit log. Never throws — logging failures must not break
 * the caller's response path.
 */
export async function logAiRequest(entry: AiRequestLogEntry): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const admin = createClient(url, key, { auth: { persistSession: false } });
    await admin.from("ai_request_log").insert({
      organization_id: entry.organizationId,
      user_id: entry.userId,
      function_name: entry.functionName,
      model: entry.model,
      input_length: entry.inputLength,
      output_length: entry.outputLength,
      input_sha256: entry.inputSha256,
      flagged: entry.flagged,
      flag_reasons: entry.flagReasons,
      latency_ms: entry.latencyMs,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
    });
  } catch (err) {
    console.warn("[aiGuard] logAiRequest failed:", err);
  }
}

/**
 * Convenience: resolves the caller's primary org_id and confirms ai_enabled.
 * Returns { allowed, organizationId }. `allowed=false` when the org has
 * AI disabled (FedRAMP G-12 / AC-20 / SA-9).
 */
export async function checkAiEnabled(userId: string): Promise<{ allowed: boolean; organizationId: string | null }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return { allowed: true, organizationId: null };
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data: m } = await admin
      .from("organization_members")
      .select("organization_id, organizations:organization_id ( ai_enabled )")
      .eq("user_id", userId)
      .maybeSingle();
    if (!m?.organization_id) return { allowed: true, organizationId: null };
    const org = Array.isArray((m as any).organizations) ? (m as any).organizations[0] : (m as any).organizations;
    return { allowed: org?.ai_enabled !== false, organizationId: m.organization_id as string };
  } catch {
    return { allowed: true, organizationId: null };
  }
}
