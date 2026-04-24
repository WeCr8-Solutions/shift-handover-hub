# Handbook Automation

This repo now includes a web-search + Ollama helper for expanding the machinist handbook with public-source material.

## What it does

- Searches the web with DuckDuckGo's HTML endpoint using topic queries from `scripts/handbook-expansion-topics.json`
- Fetches public source pages from allowed domains such as Theoretical Machinist, OSHA, NIST, Haas, and Mitutoyo
- Sends source excerpts to Ollama and asks for original handbook markdown in JSON form
- Writes idempotent SQL for `handbook_references`, including `source_citation` and `source_url`

## What it should not do

- Do not use it to copy or recreate copyrighted PDF handbook text, layouts, proprietary tables, or images
- Do not feed in a commercial Machinery's Handbook PDF and ask Ollama to rewrite chapters from it
- Use factual public web sources, or content you own/license, and keep the generated prose original

## Run it

```powershell
node scripts/expand-handbook-with-ollama.mjs --dry-run
node scripts/expand-handbook-with-ollama.mjs --topic micrometer-technique-web
node scripts/expand-handbook-with-ollama.mjs --out supabase/migrations/generated/20260424_handbook_seed.sql
```

## Environment

```powershell
$env:OLLAMA_URL="http://localhost:11434/api/chat"
$env:OLLAMA_MODEL="qwen2.5-coder:7b"
```

## Review flow

1. Run the generator.
2. Review the SQL and source URLs.
3. Check that generated prose is original and not too close to source wording.
4. Apply the migration only after review.

## Video content

Metrology video seeding for OAP and GCA is handled separately in Supabase migrations. The current seed intentionally reuses vetted public YouTube URLs for micrometer and caliper training.
