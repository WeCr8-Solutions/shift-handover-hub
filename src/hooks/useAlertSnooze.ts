import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Per-user, per-device alert snooze + bulk-ack store.
 * Smart alerts are derived (RPC) so we can't persist a row per ack; instead
 * we keep dismissals in localStorage keyed by alert id with an expiry.
 */

interface SnoozeMap {
  [alertId: string]: number; // expires-at epoch ms; Infinity-ish for permanent ack
}

const PERMANENT = 8640000000000000; // max date

function storageKey(userId: string | undefined) {
  return `joblineai_alert_snooze_${userId ?? "anon"}`;
}

function readMap(userId: string | undefined): SnoozeMap {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SnoozeMap;
    const now = Date.now();
    // prune expired
    let changed = false;
    for (const id of Object.keys(parsed)) {
      if (parsed[id] <= now) {
        delete parsed[id];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(storageKey(userId), JSON.stringify(parsed));
    return parsed;
  } catch {
    return {};
  }
}

function writeMap(userId: string | undefined, next: SnoozeMap) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export const SNOOZE_OPTIONS: { label: string; ms: number }[] = [
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "4 hours", ms: 4 * 60 * 60 * 1000 },
  { label: "Until tomorrow", ms: 24 * 60 * 60 * 1000 },
];

export function useAlertSnooze() {
  const { user } = useAuth();
  const [map, setMap] = useState<SnoozeMap>(() => readMap(user?.id));

  useEffect(() => {
    setMap(readMap(user?.id));
  }, [user?.id]);

  const isSnoozed = useCallback(
    (alertId: string) => {
      const exp = map[alertId];
      return typeof exp === "number" && exp > Date.now();
    },
    [map],
  );

  const snooze = useCallback(
    (alertId: string, ms: number) => {
      const next: SnoozeMap = { ...map, [alertId]: Date.now() + ms };
      writeMap(user?.id, next);
      setMap(next);
    },
    [map, user?.id],
  );

  const acknowledge = useCallback(
    (alertId: string) => {
      const next: SnoozeMap = { ...map, [alertId]: PERMANENT };
      writeMap(user?.id, next);
      setMap(next);
    },
    [map, user?.id],
  );

  const acknowledgeMany = useCallback(
    (alertIds: string[]) => {
      const next: SnoozeMap = { ...map };
      for (const id of alertIds) next[id] = PERMANENT;
      writeMap(user?.id, next);
      setMap(next);
    },
    [map, user?.id],
  );

  const clearAll = useCallback(() => {
    writeMap(user?.id, {});
    setMap({});
  }, [user?.id]);

  return { isSnoozed, snooze, acknowledge, acknowledgeMany, clearAll };
}
