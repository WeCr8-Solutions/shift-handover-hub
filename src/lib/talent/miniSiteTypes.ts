/** Mini-site / digital business card content types stored as jsonb on operator_profiles. */

export interface ServiceItem {
  id: string;
  title: string;
  description?: string;
  /** Optional starting price label e.g. "$45/hr" or "From $250" */
  price?: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
}

/** Hours of operation; null means closed that day. */
export interface BusinessHours {
  mon: { open: string; close: string } | null;
  tue: { open: string; close: string } | null;
  wed: { open: string; close: string } | null;
  thu: { open: string; close: string } | null;
  fri: { open: string; close: string } | null;
  sat: { open: string; close: string } | null;
  sun: { open: string; close: string } | null;
  /** Free-text e.g. "By appointment" */
  notes?: string;
}

export const DAY_LABELS: Array<{ key: keyof BusinessHours; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export const newId = (): string =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));
