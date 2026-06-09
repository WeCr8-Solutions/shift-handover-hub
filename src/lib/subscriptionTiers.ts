/**
 * Canonical subscription-tier source.
 *
 * Parses `src/content/subscription-tiers.md` once at module load and exports
 * typed records for tiers, add-ons, FAQ, and global meta.  Stripe price /
 * product IDs are merged in from `tierIds.ts` (kept out of the editable
 * markdown).  Edit the markdown to change pricing copy; pricing displayed on
 * `/pricing`, the Concierge Sales Pack, DOCX exports, and `/help` docs will
 * all update from the same source.
 */
// Loaded as raw text. The file uses a `.md.txt` extension to bypass the
// project's MDX rollup plugin, which otherwise compiles `.md` to JSX and
// breaks `?raw` string imports.
import rawMd from "@/content/subscription-tiers.md.txt?raw";
import { TIER_STRIPE_IDS, ERP_ADDON_STRIPE_IDS } from "@/lib/tierIds";

export interface TierMeta {
  currency: string;
  billing: string;
  trial_days: number;
  concierge_standard_amount: number;
  concierge_enterprise_amount: number;
}

export interface PlanTier {
  slug: string;
  name: string;
  price: number;
  seats: number;
  tagline?: string;
  popular?: boolean;
  additionalSeatPrice?: number;
  benefits: string[];
  /** Merged in from tierIds.ts. */
  priceId?: string;
  productId?: string;
}

export interface AddonTier {
  slug: string;
  name: string;
  price: number;
  syncLimit: number | null;
  tagline?: string;
  benefits: string[];
  priceId?: string;
  productId?: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

interface ParsedBlock {
  slug: string;
  fields: Record<string, string | string[] | boolean | number | null>;
}

const FM_RE = /^---\n([\s\S]*?)\n---\n?/;

function parseFrontmatter(src: string): { meta: Record<string, any>; rest: string } {
  const m = src.match(FM_RE);
  if (!m) return { meta: {}, rest: src };
  const meta: Record<string, any> = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    meta[k] = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  return { meta, rest: src.slice(m[0].length) };
}

function parseValue(raw: string): string | number | boolean | null {
  const v = raw.trim();
  if (v === "" || v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/**
 * Split the markdown body into ## sections (default = "tiers" section before
 * any heading), then into `# slug` blocks. Each block contains a YAML-ish
 * `key: value` list and an optional `benefits:` array.
 */
function parseSections(body: string): Record<string, ParsedBlock[]> {
  const sections: Record<string, ParsedBlock[]> = { tiers: [] };
  let currentSection = "tiers";
  let currentBlock: ParsedBlock | null = null;
  let inBenefits = false;

  const flush = () => {
    if (currentBlock) sections[currentSection].push(currentBlock);
    currentBlock = null;
    inBenefits = false;
  };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith("## ")) {
      flush();
      currentSection = line.slice(3).trim().toLowerCase().replace(/\s+/g, "_");
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      currentBlock = { slug: line.slice(2).trim(), fields: {} };
      continue;
    }
    if (!currentBlock) continue;

    if (inBenefits) {
      const m = line.match(/^\s*-\s+(.*)$/);
      if (m) {
        (currentBlock.fields.benefits as string[]).push(m[1].trim());
        continue;
      }
      inBenefits = false; // fall through to key parsing
    }

    if (line.trim() === "") continue;

    if (/^benefits\s*:\s*$/.test(line)) {
      currentBlock.fields.benefits = [];
      inBenefits = true;
      continue;
    }

    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1);
    currentBlock.fields[key] = parseValue(val);
  }
  flush();
  return sections;
}

const { meta, rest } = parseFrontmatter(rawMd);
const sections = parseSections(rest);

export const TIER_META: TierMeta = {
  currency: (meta.currency as string) ?? "USD",
  billing: (meta.billing as string) ?? "monthly",
  trial_days: Number(meta.trial_days ?? 14),
  concierge_standard_amount: Number(meta.concierge_standard_amount ?? 1500),
  concierge_enterprise_amount: Number(meta.concierge_enterprise_amount ?? 4500),
};

function toTier(b: ParsedBlock): PlanTier {
  const ids = (TIER_STRIPE_IDS as Record<string, { priceId: string; productId: string } | undefined>)[b.slug];
  return {
    slug: b.slug,
    name: String(b.fields.name ?? b.slug),
    price: Number(b.fields.price ?? 0),
    seats: Number(b.fields.seats ?? 1),
    tagline: b.fields.tagline ? String(b.fields.tagline) : undefined,
    popular: b.fields.popular === true,
    additionalSeatPrice:
      b.fields.additional_seat_price != null ? Number(b.fields.additional_seat_price) : undefined,
    benefits: Array.isArray(b.fields.benefits) ? (b.fields.benefits as string[]) : [],
    priceId: ids?.priceId,
    productId: ids?.productId,
  };
}

function toAddon(b: ParsedBlock): AddonTier {
  const ids = (ERP_ADDON_STRIPE_IDS as Record<string, { priceId: string; productId: string } | undefined>)[b.slug];
  return {
    slug: b.slug,
    name: String(b.fields.name ?? b.slug),
    price: Number(b.fields.price ?? 0),
    syncLimit: b.fields.sync_limit == null ? null : Number(b.fields.sync_limit),
    tagline: b.fields.tagline ? String(b.fields.tagline) : undefined,
    benefits: Array.isArray(b.fields.benefits) ? (b.fields.benefits as string[]) : [],
    priceId: ids?.priceId,
    productId: ids?.productId,
  };
}

export const TIERS: PlanTier[] = (sections.tiers ?? []).map(toTier);
export const ADDONS: AddonTier[] = (sections.add_ons ?? sections.addons ?? []).map(toAddon);
export const FAQ: FAQItem[] = (sections.faq ?? []).map((b) => ({
  q: String(b.fields.q ?? ""),
  a: String(b.fields.a ?? ""),
}));

/** Lookup helpers — used by Pricing page + Concierge pack. */
export const TIER_MAP: Record<string, PlanTier> = Object.fromEntries(TIERS.map((t) => [t.slug, t]));
export const ADDON_MAP: Record<string, AddonTier> = Object.fromEntries(ADDONS.map((t) => [t.slug, t]));

/**
 * Back-compat shape mirroring the old hand-written `PRICING_TIERS` object so
 * existing imports keep working. Prefer `TIERS` / `TIER_MAP` in new code.
 */
export const PRICING_TIERS_LEGACY = Object.fromEntries(
  TIERS.map((t) => [
    t.slug,
    {
      name: t.name,
      price: t.price,
      priceId: t.priceId ?? "",
      productId: t.productId ?? "",
      users: t.seats,
      additionalUserPrice: t.additionalSeatPrice,
      features: t.benefits,
    },
  ]),
) as Record<string, {
  name: string;
  price: number;
  priceId: string;
  productId: string;
  users: number;
  additionalUserPrice?: number;
  features: string[];
}>;

export const ERP_ADDON_TIERS_LEGACY = Object.fromEntries(
  ADDONS.map((t) => {
    // Map md slug (erp_starter) → legacy key (starter)
    const key = t.slug.replace(/^erp_/, "");
    return [
      key,
      {
        name: t.name,
        price: t.price,
        priceId: t.priceId ?? "",
        productId: t.productId ?? "",
        syncLimit: t.syncLimit ?? 999_999,
        features: t.benefits,
      },
    ];
  }),
) as Record<string, {
  name: string;
  price: number;
  priceId: string;
  productId: string;
  syncLimit: number;
  features: string[];
}>;
