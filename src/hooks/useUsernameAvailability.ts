import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export type UsernameStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "self"
  | "error";

/**
 * Live username availability check against operator_profiles.public_username.
 * Debounced 400ms. Returns "self" if the username belongs to the current user.
 */
export function useUsernameAvailability(
  username: string,
  currentUserId: string | undefined,
  currentUsername: string | null | undefined
): { status: UsernameStatus; message: string } {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (!USERNAME_RE.test(u)) {
      setStatus("invalid");
      setMessage("3–30 chars: lowercase letters, numbers, hyphens, underscores. Must start with letter or number.");
      return;
    }
    if (currentUsername && u === currentUsername.toLowerCase()) {
      setStatus("self");
      setMessage("This is your current username.");
      return;
    }

    setStatus("checking");
    setMessage("Checking availability…");
    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("operator_profiles")
          .select("user_id")
          .eq("public_username", u)
          .maybeSingle();
        if (error) throw error;
        if (!data || data.user_id === currentUserId) {
          setStatus("available");
          setMessage("Available ✓");
        } else {
          setStatus("taken");
          setMessage("Already taken — try a different one.");
        }
      } catch {
        setStatus("error");
        setMessage("Couldn't check right now. Try again.");
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [username, currentUserId, currentUsername]);

  return { status, message };
}

export function suggestUsernames(seed: string): string[] {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (!base) return [];
  const rand = () => Math.floor(Math.random() * 90 + 10);
  const trades = ["machinist", "cnc", "operator", "shop", "ops"];
  return Array.from(
    new Set([
      base,
      `${base}-${trades[0]}`,
      `${base}-${trades[1]}`,
      `${base}${rand()}`,
      `${base}-${rand()}`,
    ])
  )
    .filter((s) => s.length >= 3 && s.length <= 30)
    .slice(0, 5);
}
