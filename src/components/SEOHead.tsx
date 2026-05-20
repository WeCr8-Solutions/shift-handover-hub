import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = "https://jobline.ai";
const DEFAULT_TITLE = "JobLine.ai - Digital Expeditor & Smart Shift Handoff System for Manufacturing";
const DEFAULT_DESCRIPTION = "Streamline CNC manufacturing operations with JobLine.ai. Track work orders, manage shift handoffs, coordinate routing, and improve production floor communication. Built for machine shops and fabrication teams.";
const DEFAULT_KEYWORDS = "manufacturing software, shift handoff, work order tracking, CNC machining, production management, machine shop software, manufacturing execution system, MES, digital expeditor, production scheduling, production control, shop floor management";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function normalizeTitle(title?: string) {
  if (!title) {
    return DEFAULT_TITLE;
  }

  const trimmedTitle = title.trim();
  return /\bJobLine\.ai\b/i.test(trimmedTitle) ? trimmedTitle : `${trimmedTitle} | JobLine.ai`;
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
}: SEOHeadProps) {
  const fullTitle = normalizeTitle(title);
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

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
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="JobLine.ai" />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Language & Geographic Targeting */}
      <meta httpEquiv="content-language" content="en" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      {canonicalUrl && (
        <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      )}

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
