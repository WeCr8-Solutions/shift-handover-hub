import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_CONFIG = path.resolve("scripts/handbook-expansion-topics.json");
const DEFAULT_OUT_DIR = path.resolve("supabase/migrations/generated");
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const DEFAULT_OLLAMA_TIMEOUT_MS = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || "60000", 10);
const DEFAULT_SEARCH_LIMIT = Number.parseInt(process.env.HANDBOOK_SEARCH_LIMIT || "5", 10);
const DEFAULT_FETCH_LIMIT = Number.parseInt(process.env.HANDBOOK_SOURCE_LIMIT || "3", 10);
const USER_AGENT = "JobLine-HandbookBot/1.0 (+https://jobline.ai)";

function printHelp() {
  console.log(`Usage: node scripts/expand-handbook-with-ollama.mjs [options]

Options:
  --config <path>        Topic config JSON. Default: scripts/handbook-expansion-topics.json
  --out <path>           Output SQL file. Default: supabase/migrations/generated/<timestamp>_handbook_web_seed.sql
  --topic <slug>         Generate only one topic slug from the config
  --search-limit <n>     DuckDuckGo result count per query. Default: ${DEFAULT_SEARCH_LIMIT}
  --fetch-limit <n>      Max source pages fetched per topic. Default: ${DEFAULT_FETCH_LIMIT}
  --ollama-url <url>     Ollama chat endpoint. Default: ${DEFAULT_OLLAMA_URL}
  --model <name>         Ollama model name. Default: ${DEFAULT_MODEL}
  --ollama-timeout <ms>  Ollama request timeout in ms. Default: ${DEFAULT_OLLAMA_TIMEOUT_MS}
  --dry-run              Print SQL to stdout instead of writing a file
  --help                 Show this help

Environment:
  OLLAMA_URL             Override Ollama endpoint
  OLLAMA_MODEL           Override Ollama model
  OLLAMA_TIMEOUT_MS      Ollama request timeout in milliseconds
  HANDBOOK_SEARCH_LIMIT  Default search result count
  HANDBOOK_SOURCE_LIMIT  Default source fetch count

Notes:
  - This script synthesizes original handbook prose from public web sources.
  - Do not use it to reproduce copyrighted PDF handbook text or proprietary tables verbatim.
`);
}

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    out: "",
    topic: "",
    dryRun: false,
    searchLimit: DEFAULT_SEARCH_LIMIT,
    fetchLimit: DEFAULT_FETCH_LIMIT,
    ollamaUrl: DEFAULT_OLLAMA_URL,
    model: DEFAULT_MODEL,
    ollamaTimeoutMs: DEFAULT_OLLAMA_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--config":
        args.config = path.resolve(argv[++index]);
        break;
      case "--out":
        args.out = path.resolve(argv[++index]);
        break;
      case "--topic":
        args.topic = argv[++index];
        break;
      case "--search-limit":
        args.searchLimit = Number.parseInt(argv[++index], 10);
        break;
      case "--fetch-limit":
        args.fetchLimit = Number.parseInt(argv[++index], 10);
        break;
      case "--ollama-url":
        args.ollamaUrl = argv[++index];
        break;
      case "--model":
        args.model = argv[++index];
        break;
      case "--ollama-timeout":
        args.ollamaTimeoutMs = Number.parseInt(argv[++index], 10);
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(items) {
  if (!items?.length) return "ARRAY[]::text[]";
  return `ARRAY[${items.map((item) => sqlString(item)).join(", ")}]`;
}

function prettifyLabel(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeInlineValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => normalizeInlineValue(item)).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof value === "object") {
    const parts = Object.entries(value)
      .map(([key, item]) => {
        const normalized = normalizeInlineValue(item);
        return normalized ? `${prettifyLabel(key)}: ${normalized}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  return null;
}

function normalizeMarkdown(value, depth = 0) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const allInline = value.every(
      (item) => item === null || item === undefined || ["string", "number", "boolean"].includes(typeof item),
    );
    if (allInline) {
      return value
        .map((item) => normalizeInlineValue(item))
        .filter(Boolean)
        .map((item) => `- ${item}`)
        .join("\n");
    }

    return value
      .map((item) => normalizeMarkdown(item, depth + 1))
      .filter(Boolean)
      .join("\n\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const label = prettifyLabel(key);
        const rendered = normalizeMarkdown(item, depth + 1);
        if (!rendered) return "";

        const isBlock = /\n/.test(rendered) || typeof item === "object";
        if (isBlock) {
          const headingLevel = "#".repeat(Math.min(depth + 2, 6));
          return `${headingLevel} ${label}\n${rendered}`;
        }

        return `**${label}:** ${rendered}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function escapeJsonControlChars(value) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString && (char === "\n" || char === "\r" || char === "\t")) {
      result += JSON.stringify(char).slice(1, -1);
      continue;
    }

    result += char;
  }

  return result;
}

function parseModelJson(content) {
  const unfenced = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");
  const jsonCandidate = firstBrace >= 0 && lastBrace > firstBrace
    ? unfenced.slice(firstBrace, lastBrace + 1)
    : unfenced;

  try {
    return JSON.parse(jsonCandidate);
  } catch {
    return JSON.parse(escapeJsonControlChars(jsonCandidate));
  }
}

function hostAllowed(url, allowedDomains) {
  if (!allowedDomains?.length) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractSearchLinks(html, allowedDomains, limit) {
  const links = [];
  const seen = new Set();
  const hrefRegex = /href="(?:\/l\/\?kh=-1&uddg=|\/html\/\?q=.*?&uddg=)([^"#]+)"/g;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const decoded = decodeURIComponent(decodeHtmlEntities(match[1]));
    if (!decoded.startsWith("http")) continue;
    if (!hostAllowed(decoded, allowedDomains)) continue;
    if (seen.has(decoded)) continue;
    seen.add(decoded);
    links.push(decoded);
    if (links.length >= limit) break;
  }

  return links;
}

async function searchWeb(query, allowedDomains, limit) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url);
  return extractSearchLinks(html, allowedDomains, limit);
}

function extractReadableText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

async function buildSourcePacket(topic, allowedDomains, searchLimit, fetchLimit) {
  const candidates = [];

  for (const sourceUrl of topic.sourceUrls || []) {
    if (!candidates.includes(sourceUrl)) {
      candidates.push(sourceUrl);
    }
  }

  if (candidates.length === 0) {
    for (const query of topic.searchQueries || []) {
      try {
        const links = await searchWeb(query, allowedDomains, searchLimit);
        for (const link of links) {
          if (!candidates.includes(link)) candidates.push(link);
        }
      } catch (error) {
          console.warn(`Search failed for "${query}": ${error.message}`);
      }
    }
  }

  const excerpts = [];
  for (const url of candidates.slice(0, fetchLimit)) {
    try {
      const html = await fetchText(url);
      const text = extractReadableText(html).slice(0, 6000);
      if (text.length >= 400) {
        excerpts.push({ url, text });
      }
    } catch (error) {
      console.warn(`Fetch failed for ${url}: ${error.message}`);
    }
  }

  if (!excerpts.length) {
    throw new Error(`No usable sources found for topic ${topic.slug}`);
  }

  return excerpts;
}

async function callOllama(topic, excerpts, ollamaUrl, model, timeoutMs) {
  const body = {
    model,
    stream: false,
    messages: [
      {
        role: "system",
        content:
          "You generate original machinist handbook entries from cited public web sources. Use only factual content that appears in the sources. Do not copy long phrases, tables, charts, or proprietary wording verbatim. Do not mention copyrighted books, PDFs, or images unless the source excerpts explicitly do and you are only citing them. Return JSON only with keys: slug, title, summary, bodyMd, formula, units, sourceCitation, sourceUrl, tags, difficulty.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            topic: {
              slug: topic.slug,
              categorySlug: topic.categorySlug,
              titleHint: topic.titleHint,
              tags: topic.tags || [],
              difficulty: topic.difficulty || null,
            },
            requirements: {
              bodyStyle: [
                "Use concise original markdown with short sections and bullet points where useful.",
                "Preserve factual formulas and measurement units.",
                "If exact numeric ranges conflict across sources, note the range conservatively in prose.",
                "Do not output HTML.",
              ],
            },
            sources: excerpts,
          },
          null,
          2,
        ),
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Ollama request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.message?.content?.trim();
  if (!content) throw new Error(`Ollama returned no content for ${topic.slug}`);

  const parsed = parseModelJson(content);
  return {
    slug: slugify(parsed.slug || topic.slug),
    title: normalizeInlineValue(parsed.title) || topic.titleHint || topic.slug,
    summary: normalizeInlineValue(parsed.summary),
    bodyMd: normalizeMarkdown(parsed.bodyMd ?? parsed.body_md),
    formula: normalizeInlineValue(parsed.formula),
    units: normalizeInlineValue(parsed.units),
    sourceCitation: normalizeInlineValue(parsed.sourceCitation || parsed.source_citation),
    sourceUrl: parsed.sourceUrl || parsed.source_url || excerpts[0].url,
    tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : topic.tags || [],
    difficulty: normalizeInlineValue(parsed.difficulty) || topic.difficulty || null,
    categorySlug: topic.categorySlug,
  };
}

function buildSql(entries) {
  const header = [
    "-- Generated by scripts/expand-handbook-with-ollama.mjs",
    "-- Review generated prose before applying in production.",
    "",
  ];

  const blocks = entries.map((entry) => `DO $$
DECLARE
  _category_id uuid;
BEGIN
  SELECT id INTO _category_id
  FROM public.handbook_categories
  WHERE slug = ${sqlString(entry.categorySlug)}
    AND organization_id IS NULL
  LIMIT 1;

  IF _category_id IS NULL THEN
    RAISE EXCEPTION 'Missing canonical handbook category: ${entry.categorySlug}';
  END IF;

  INSERT INTO public.handbook_references (
    category_id,
    slug,
    title,
    summary,
    body_md,
    formula,
    units,
    source_citation,
    source_url,
    tags,
    difficulty,
    is_canonical,
    organization_id
  ) VALUES (
    _category_id,
    ${sqlString(entry.slug)},
    ${sqlString(entry.title)},
    ${sqlString(entry.summary)},
    ${sqlString(entry.bodyMd)},
    ${sqlString(entry.formula)},
    ${sqlString(entry.units)},
    ${sqlString(entry.sourceCitation)},
    ${sqlString(entry.sourceUrl)},
    ${sqlArray(entry.tags)},
    ${sqlString(entry.difficulty)},
    true,
    NULL
  )
  ON CONFLICT (slug, organization_id)
  DO UPDATE SET
    category_id = EXCLUDED.category_id,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    body_md = EXCLUDED.body_md,
    formula = EXCLUDED.formula,
    units = EXCLUDED.units,
    source_citation = EXCLUDED.source_citation,
    source_url = EXCLUDED.source_url,
    tags = EXCLUDED.tags,
    difficulty = EXCLUDED.difficulty,
    updated_at = now();
END $$;`);

  return `${header.join("\n")}${blocks.join("\n\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configText = await fs.readFile(args.config, "utf8");
  const config = JSON.parse(configText);
  const topics = (config.topics || []).filter((topic) => !args.topic || topic.slug === args.topic);

  if (!topics.length) {
    throw new Error(args.topic ? `Topic not found in config: ${args.topic}` : "No topics in config");
  }

  const entries = [];
  for (const topic of topics) {
    console.log(`Searching and drafting ${topic.slug}...`);
    const excerpts = await buildSourcePacket(
      topic,
      config.allowedDomains || [],
      args.searchLimit,
      args.fetchLimit,
    );
    const entry = await callOllama(topic, excerpts, args.ollamaUrl, args.model, args.ollamaTimeoutMs);
    entries.push(entry);
  }

  const sql = buildSql(entries);
  if (args.dryRun) {
    process.stdout.write(sql);
    return;
  }

  const outPath = args.out || path.join(DEFAULT_OUT_DIR, `${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}_handbook_web_seed.sql`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, sql, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});