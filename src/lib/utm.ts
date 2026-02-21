/**
 * UTM Parameter Capture & Persistence
 * Parses UTM params from URL, stores in sessionStorage, and cleans the visible URL.
 *
 * ─── UTM LINK BUILDER REFERENCE ───
 *
 * Template: https://www.jobline.ai/?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
 *
 * LinkedIn personal post:
 *   utm_source=linkedin&utm_medium=organic&utm_campaign=founder_post&utm_content=post_01
 *
 * LinkedIn company post:
 *   utm_source=linkedin&utm_medium=organic&utm_campaign=wecr8_post&utm_content=post_01
 *
 * LinkedIn DM / outreach:
 *   utm_source=linkedin&utm_medium=dm&utm_campaign=outreach&utm_content=message_01
 *
 * Paid ads (future):
 *   utm_source=linkedin&utm_medium=paid&utm_campaign=jobline_leads&utm_content=ad_01
 *
 * Email campaign:
 *   utm_source=email&utm_medium=newsletter&utm_campaign=launch_announce&utm_content=cta_hero
 */

const UTM_STORAGE_KEY = 'jobline_utm';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Capture UTM params from current URL. If present, store and clean URL.
 * If not present, return previously stored values.
 */
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const hasUtm = UTM_KEYS.some((k) => params.has(k));

  if (hasUtm) {
    const utm: UtmParams = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });

    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));

    // Strip UTM params from URL without reload
    UTM_KEYS.forEach((k) => params.delete(k));
    const remaining = params.toString();
    const cleanUrl =
      window.location.pathname + (remaining ? `?${remaining}` : '') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);

    return utm;
  }

  return getUtmParams();
}

/**
 * Retrieve stored UTM params (or empty object).
 */
export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}
