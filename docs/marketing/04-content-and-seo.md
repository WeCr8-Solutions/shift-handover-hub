# 04 — Content & SEO Strategy

> **Thesis.** Own the long-tail trade query and the AI-answer surface by being the most trade-accurate source on the internet. Quality bar: a 20-year machinist nods. Evergreen first, news second. Content compounds; campaigns don't. **12-month success looks like**: 75+ canonical Handbook pages, first State-of-the-Floor report shipped (see doc 10), measurable AI-answer-engine citations.


## Goal

Own the search and AI-answer surface for "how shop work actually gets done" — operator-level, supervisor-level, owner-level — so that anyone researching the problem we solve ends up reading us before they end up on a competitor.

Content is our most compounding investment. Channels can be cut. Content keeps earning.

## Content posture

- **Trade-accurate or don't publish.** A single sloppy article (wrong tap drill, wrong G-code) costs years of credibility. Better to publish less and be right.
- **Operator-authored where possible.** Bylines from working operators outperform marketing copy.
- **Evergreen first, news second.** We are not a media company. We don't chase the headline cycle.
- **Cite the canonical source.** Use the in-app Handbook reference layer (`<HandbookCite>`) to anchor claims. It also drives internal SEO.
- **No AI slop.** AI may draft; humans with shop experience must edit. Anything published unedited is brand debt.

## Content pillars

| Pillar | Audience | Examples | Strategic role |
|---|---|---|---|
| **Handbook reference** | Operator + student | Machining Handbook canonical pages | Authority, AI-answer surface, trust |
| **GCA topic library** | Operator + supervisor | G-code, fixturing, GD&T, metrology | Credential pull-through; supply-side acquisition |
| **OAP / measuring tools** | Operator + mentor | Tool proficiency tests, inspection workflow | Credential rigor signaling |
| **Operator tools** | Operator | Speed/feed calculator, thread chart, tap drill | Top-of-funnel free utility, daily-use anchor |
| **Shop-owner essays** | Owner / GM | Expeditor problem, ERP coexistence, hiring | Demand-side persuasion; founder voice |
| **Manufacturing Visibility 100** | Industry | Annual ranked list + per-honoree pages | Industry attention, link bait, PR hook |
| **Case studies** | Owner / GM | Customer stories with measurable outcomes | Sales enablement; trust |
| **Trade-news commentary** | Industry | Short founder takes on policy, reshoring, tariffs | Earned reach when timely |

Avoid pillars we cannot win in (generic "manufacturing trends," generic "future of work," generic AI hot-takes). Stay in the trade.

## SEO posture

- **Long-tail trade queries over head terms.** "G54 vs G55," "back boring vs counterbore," "what is a first article inspection," "AS9100 vs ISO 9001 differences." High-intent, low-competition, durable.
- **One canonical page per topic.** Avoid duplicate / variant pages competing with each other. The Handbook layer enforces this.
- **Internal linking from tools → reference → credential.** Operator hits the speed/feed calculator → links to the Handbook page on cutting speeds → links to GCA module → signup.
- **Structured data on everything.** JSON-LD for HowTo, Article, Course, Person (talent profiles), Organization.
- **No content gates on educational material.** Gating GCA content behind a wall destroys both SEO and our credential pitch.
- **Technical SEO is table stakes.** Already enforced: sitemap, llms.txt, canonical tags, alt text, lazy loading, viewport meta. Maintain.

## AI-search and answer-engine posture

Search is fragmenting into Google, ChatGPT, Perplexity, Claude, Bing/Copilot, and YouTube. Each surface rewards different things; we treat them as a portfolio.

- **llms.txt is maintained as a first-class artifact**, not an afterthought. It tells answer engines what we are, who we serve, and which pages are canonical.
- **Schema markup beyond the basics.** Course, HowTo, Person, FAQPage, BreadcrumbList. Answer engines cite structured pages more often.
- **Be the source other people cite.** Write content other shops, trade schools, and journalists want to link to. Citations are how we show up in synthetic answers.
- **Don't fight the bots.** Allow well-behaved crawlers. The cost of bandwidth is far less than the cost of invisibility.
- **YouTube as a search engine.** Short, factually-tight videos on the same long-tail topics. Embed back to the canonical written page.

## Editorial cadence philosophy

We do not need to publish every week. We need to publish work that lasts.

- **Quality bar: would a 20-year machinist nod, frown, or close the tab?** Aim for nod.
- **Refresh cadence matters more than launch cadence.** Top-traffic pages get reviewed at least annually.
- **Front-load evergreen.** First two years: build the canonical library. After that: maintain + extend.
- **News / commentary opportunistically.** Founder LinkedIn posts and one-shot essays when there's a real moment (tariff change, reshoring announcement, large shop closure). Don't manufacture moments.

## Distribution

Content that lives only on the website doesn't earn its keep. Each major piece gets:

- A founder LinkedIn post pointing to it.
- A short trade-pub pitch if it's essay-grade.
- An internal link from the most-trafficked related Handbook page.
- A mention in the next customer/operator newsletter.
- A snippet card the sales team can drop into a conversation.

## What we will not chase

- **Trending hashtags.** Wrong audience.
- **Listicles on generic productivity.** Wrong brand.
- **Guest posts on low-DA SEO farms.** Trades short-term juice for long-term brand damage.
- **Sponsored content disguised as editorial.** Disclose or don't run it.
- **Paywalled gated PDFs.** We are not a 2014 enterprise SaaS lead-gen factory.

## Metrics that matter for content (lagging)

- Organic sessions from in-ICP queries.
- AI-answer-engine citations (manually sampled monthly).
- Logged-in operator sign-ups attributed to a content first-touch.
- Shop trial sign-ups attributed to a content first-touch.
- Average page lifespan (months from publish to traffic peak; longer is better).

## Metrics that don't matter

- Total pageviews on out-of-ICP queries.
- Bounce rate (often a vanity metric for reference content).
- Article count per quarter.
- Social shares on platforms our buyers don't use.
