/**
 * Central registry for every Amazon book link used across the site.
 *
 * One place to update an ASIN, swap a URL, or roll out an affiliate tag.
 *
 * How to roll out an affiliate tag in production:
 *   1. Set AFFILIATE_TAG below to your Amazon Associates tag (e.g. "joblineai-20").
 *   2. Ship. Every link rendered through getAmazonUrl(asin) updates instantly.
 *
 * For per-book overrides (e.g. an edition change, a different storefront),
 * add an entry to overrideUrl on the book — that wins over the global tag.
 *
 * Dev/admin preview: the gated admin page at /admin/amazon-links can stage
 * overrides in localStorage without a code change, then export the new
 * constants to paste back here.
 */

export const AFFILIATE_TAG = ""; // e.g. "joblineai-20" — empty = clean /dp links

export type BookUsageKind = "blog" | "resource-page" | "doc";

export interface BookUsage {
  kind: BookUsageKind;
  path: string; // e.g. "/blog/lessons-from-toyota-production-system"
  label: string; // human description of where it appears
}

export type BookRole =
  | "Operator"
  | "Machinist / Programmer"
  | "Quality"
  | "Lean / CI"
  | "Supervisor"
  | "Manufacturing Engineer"
  | "Owner / Manager";

export type BookCategory =
  | "Reference"
  | "CNC"
  | "Quality"
  | "Lean / TPS"
  | "Throughput"
  | "Leadership"
  | "History";

export interface AmazonBook {
  asin: string;
  title: string;
  author: string;
  year?: string;
  category: BookCategory;
  roles: BookRole[];
  why: string;
  /** Optional URL override that wins over the default /dp/ASIN build. */
  overrideUrl?: string;
  usages: BookUsage[];
}

export const AMAZON_BOOKS: AmazonBook[] = [
  // Reference
  {
    asin: "0831146311",
    title: "Machinery's Handbook (32nd Edition)",
    author: "Erik Oberg et al. — Industrial Press",
    year: "2020",
    category: "Reference",
    roles: ["Machinist / Programmer", "Manufacturing Engineer", "Quality", "Supervisor"],
    why: "The single reference every machine shop should own. Threads, tap drills, materials, formulas, GD&T — used daily on the floor and in engineering.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  {
    asin: "0831130792",
    title: "Shop Reference for Students & Apprentices",
    author: "Edward G. Hoffman — Industrial Press",
    category: "Reference",
    roles: ["Operator", "Machinist / Programmer"],
    why: "Pocket-sized companion to Machinery's Handbook. Perfect first reference for new operators and apprentices.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  // CNC
  {
    asin: "0831133473",
    title: "CNC Programming Handbook (3rd Ed.)",
    author: "Peter Smid",
    category: "CNC",
    roles: ["Machinist / Programmer", "Manufacturing Engineer"],
    why: "The standard CNC programming text. Fanuc-flavored G/M-code, canned cycles, work offsets, macros — the book every programmer learns from.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  {
    asin: "083113636X",
    title: "The CNC Handbook (Kief / Roschiwal / Schwarz)",
    author: "Hans B. Kief et al.",
    year: "2021",
    category: "CNC",
    roles: ["Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    why: "Modern coverage from CNC fundamentals through Industry 4.0, automation, and digital manufacturing. Bridges shop-floor and engineering.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  {
    asin: "0831136960",
    title: "CNC Beginner's Guide: CAD, CAM, and Machining",
    author: "Industrial Press",
    year: "2025",
    category: "CNC",
    roles: ["Operator"],
    why: "Plain-English path from CAD to chips. The right starting point for a new operator who wants to grow into programming.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  // Quality
  {
    asin: "0262541157",
    title: "Out of the Crisis",
    author: "W. Edwards Deming",
    category: "Quality",
    roles: ["Quality", "Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    why: "The book that defines modern quality thinking. 94% of problems are the system, not the worker. Required reading for anyone who owns process.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/quality-lessons-from-deming-juran-shewhart-ishikawa", label: "Quality Lessons from Deming, Juran, Shewhart & Ishikawa" },
    ],
  },
  {
    asin: "1259643611",
    title: "Juran's Quality Handbook (7th Ed.)",
    author: "Joseph M. Juran & Joseph A. De Feo",
    category: "Quality",
    roles: ["Quality", "Manufacturing Engineer"],
    why: "The desk reference for quality engineers. COPQ, Pareto, planning, control, improvement — depth no blog post matches.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/quality-lessons-from-deming-juran-shewhart-ishikawa", label: "Quality Lessons from Deming, Juran, Shewhart & Ishikawa" },
    ],
  },
  {
    asin: "9283310365",
    title: "Guide to Quality Control",
    author: "Kaoru Ishikawa",
    category: "Quality",
    roles: ["Quality", "Supervisor", "Operator"],
    why: "The Seven Basic Quality Tools, including the fishbone diagram. Operator-friendly, supervisor-essential.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/quality-lessons-from-deming-juran-shewhart-ishikawa", label: "Quality Lessons from Deming, Juran, Shewhart & Ishikawa" },
    ],
  },
  {
    asin: "1614278113",
    title: "Economic Control of Quality of Manufactured Product",
    author: "Walter A. Shewhart",
    category: "Quality",
    roles: ["Quality", "Manufacturing Engineer"],
    why: "The origin of SPC and control charts. Common-cause vs. special-cause variation — still the framework every quality engineer uses.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/quality-lessons-from-deming-juran-shewhart-ishikawa", label: "Quality Lessons from Deming, Juran, Shewhart & Ishikawa" },
    ],
  },
  // Lean / TPS
  {
    asin: "0915299143",
    title: "Toyota Production System: Beyond Large-Scale Production",
    author: "Taiichi Ohno",
    category: "Lean / TPS",
    roles: ["Lean / CI", "Supervisor", "Manufacturing Engineer", "Owner / Manager"],
    why: "Ohno in his own words. Stop-the-line, the seven wastes, pull systems — the source text for everything called 'lean' today.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/lessons-from-toyota-production-system", label: "Lessons from the Toyota Production System" },
    ],
  },
  {
    asin: "0915299038",
    title: "A Revolution in Manufacturing: The SMED System",
    author: "Shigeo Shingo",
    category: "Lean / TPS",
    roles: ["Lean / CI", "Manufacturing Engineer", "Machinist / Programmer"],
    why: "Single-Minute Exchange of Die. The book that turned setup reduction into a teachable discipline. Direct path to more throughput.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/lessons-from-toyota-production-system", label: "Lessons from the Toyota Production System" },
    ],
  },
  {
    asin: "0060974176",
    title: "The Machine That Changed the World",
    author: "Womack, Jones & Roos",
    category: "Lean / TPS",
    roles: ["Lean / CI", "Owner / Manager", "Supervisor"],
    why: "The MIT study that named 'lean production' and explained why Toyota outperformed Detroit. Essential context for any continuous-improvement effort.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/lessons-from-toyota-production-system", label: "Lessons from the Toyota Production System" },
    ],
  },
  {
    asin: "1260468518",
    title: "The Toyota Way (2nd Ed.)",
    author: "Jeffrey K. Liker",
    category: "Lean / TPS",
    roles: ["Lean / CI", "Supervisor", "Owner / Manager"],
    why: "The 14 principles, made readable for Western managers. The most assigned book in lean training programs.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  {
    asin: "0071790357",
    title: "Gemba Kaizen (2nd Ed.)",
    author: "Masaaki Imai",
    category: "Lean / TPS",
    roles: ["Supervisor", "Lean / CI", "Owner / Manager"],
    why: "Improvement happens at the gemba — the place where work is done. The shortest path from 'we should be lean' to 'we walk the floor every day.'",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  {
    asin: "0071441190",
    title: "The Lean Six Sigma Pocket Toolbook",
    author: "Michael L. George et al.",
    category: "Lean / TPS",
    roles: ["Lean / CI", "Supervisor", "Quality"],
    why: "The pocket reference for everyday improvement tools — 5S, A3, fishbone, value stream maps. Cheap, durable, used.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  // Throughput
  {
    asin: "0884271951",
    title: "The Goal",
    author: "Eliyahu M. Goldratt",
    category: "Throughput",
    roles: ["Supervisor", "Owner / Manager", "Manufacturing Engineer", "Lean / CI"],
    why: "Theory of Constraints as a novel. Read in a weekend, applied for a career. Changes how supervisors and owners think about bottlenecks.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/throughput-lessons-goldratt-taylor-ford", label: "Throughput Lessons from Goldratt, Taylor & Ford" },
    ],
  },
  {
    asin: "1577667395",
    title: "Factory Physics (3rd Ed.)",
    author: "Hopp & Spearman",
    category: "Throughput",
    roles: ["Manufacturing Engineer", "Owner / Manager"],
    why: "The math behind WIP, cycle time, and throughput. If The Goal is the story, Factory Physics is the engineering.",
    usages: [{ kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" }],
  },
  // History
  {
    asin: "0486299880",
    title: "The Principles of Scientific Management",
    author: "Frederick W. Taylor",
    category: "History",
    roles: ["Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    why: "The original. You can't argue with — or against — modern manufacturing without reading the document that started industrial engineering.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/throughput-lessons-goldratt-taylor-ford", label: "Throughput Lessons from Goldratt, Taylor & Ford" },
    ],
  },
  {
    asin: "1162577940",
    title: "My Life and Work",
    author: "Henry Ford",
    category: "History",
    roles: ["Owner / Manager", "Manufacturing Engineer"],
    why: "Ford in 1922 — flow beats utilization, wages drive demand, vertical integration. The roots of mass production in his own voice.",
    usages: [
      { kind: "resource-page", path: "/resources/essential-reading", label: "Essential Reading library" },
      { kind: "blog", path: "/blog/throughput-lessons-goldratt-taylor-ford", label: "Throughput Lessons from Goldratt, Taylor & Ford" },
    ],
  },
];

// -----------------------------------------------------------------------------
// Runtime URL resolver
// -----------------------------------------------------------------------------

/**
 * Local override shape staged by the admin UI (in localStorage).
 * Persisted only in the current browser — for previewing tag/url changes
 * before committing them to AFFILIATE_TAG / overrideUrl in this file.
 */
export interface AmazonOverrideState {
  tag: string;
  urlOverrides: Record<string, string>; // ASIN -> full URL
}

const LS_KEY = "amazon-link-overrides-v1";

export function readLocalOverrides(): AmazonOverrideState {
  if (typeof window === "undefined") return { tag: "", urlOverrides: {} };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { tag: "", urlOverrides: {} };
    const parsed = JSON.parse(raw);
    return {
      tag: typeof parsed.tag === "string" ? parsed.tag : "",
      urlOverrides:
        parsed.urlOverrides && typeof parsed.urlOverrides === "object" ? parsed.urlOverrides : {},
    };
  } catch {
    return { tag: "", urlOverrides: {} };
  }
}

export function writeLocalOverrides(state: AmazonOverrideState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function clearLocalOverrides(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
}

/**
 * Build the canonical Amazon URL for a book.
 *
 * Resolution order:
 *   1. Local browser override URL (admin preview only)
 *   2. Book-specific `overrideUrl` from the registry
 *   3. Build from ASIN + active affiliate tag (local tag wins over code constant)
 */
export function getAmazonUrl(asin: string): string {
  const book = AMAZON_BOOKS.find((b) => b.asin === asin);
  const local = readLocalOverrides();

  if (local.urlOverrides[asin]) return local.urlOverrides[asin];
  if (book?.overrideUrl) return book.overrideUrl;

  const tag = local.tag || AFFILIATE_TAG;
  const base = `https://www.amazon.com/dp/${asin}`;
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

export function buildAmazonUrl(asin: string, tag: string, overrideUrl?: string): string {
  if (overrideUrl) return overrideUrl;
  const base = `https://www.amazon.com/dp/${asin}`;
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

export function getBookByAsin(asin: string): AmazonBook | undefined {
  return AMAZON_BOOKS.find((b) => b.asin === asin);
}
