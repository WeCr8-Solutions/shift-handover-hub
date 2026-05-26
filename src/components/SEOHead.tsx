import { Helmet } from "react-helmet-async";

interface ArticleMeta {
  publishedTime: string;          // ISO date — article:published_time
  modifiedTime?: string;          // ISO date — article:modified_time
  author?: string;                // human display name
  authorUrl?: string;             // optional profile/byline URL
  section?: string;               // category (e.g. "Operations")
  tags?: string[];                // article:tag (repeated)
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** When provided, also emits Open Graph article:* tags. Set ogType="article". */
  article?: ArticleMeta;
}

const BASE_URL = "https://jobline.ai";
const DEFAULT_TITLE = "JobLine.ai — Digital Expeditor for CNC Shops";
const DEFAULT_DESCRIPTION = "Digital expeditor and shift handoff for CNC machine shops. Track work orders, route jobs, and run smoother shift changes.";
const DEFAULT_KEYWORDS = "manufacturing software, shift handoff, work order tracking, CNC machining, production management, machine shop software, manufacturing execution system, MES, digital expeditor, production scheduling, production control, shop floor management";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function normalizeTitle(title?: string) {
  if (!title) return DEFAULT_TITLE;
  const trimmed = title.trim();
  return /\bJobLine\.ai\b/i.test(trimmed) ? trimmed : `${trimmed} | JobLine.ai`;
}

function resolveCanonical(canonical?: string) {
  if (!canonical) return undefined;
  return canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`;
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
  article,
}: SEOHeadProps) {
  const fullTitle = normalizeTitle(title);
  const canonicalUrl = resolveCanonical(canonical);
  const resolvedOgType = article ? "article" : ogType;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={resolvedOgType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="JobLine.ai" />
      <meta property="og:image" content={ogImage} />

      {/* Article-specific Open Graph (E-E-A-T signals) */}
      {article && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.authorUrl || article.author} />
      )}
      {article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {article?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Dublin Core / generic author hints */}
      {article?.author && <meta name="author" content={article.author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {article?.author && <meta name="twitter:label1" content="Written by" />}
      {article?.author && <meta name="twitter:data1" content={article.author} />}
      {article?.section && <meta name="twitter:label2" content="Filed under" />}
      {article?.section && <meta name="twitter:data2" content={article.section} />}

      {/* Language & Geographic Targeting */}
      <meta httpEquiv="content-language" content="en" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      {canonicalUrl && <link rel="alternate" hrefLang="en" href={canonicalUrl} />}

      {/* JSON-LD — emit one <script> per entry so Google parses each schema as its own item */}
      {jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((entry, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(entry)}
          </script>
        ))}
    </Helmet>
  );
}
