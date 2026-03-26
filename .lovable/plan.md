

# File-Based MDX Blog System

## Overview

Replace the hardcoded blog post array with real MDX files loaded via Vite glob imports. Add individual post pages at `/blog/:slug`.

## Changes

### 1. Install dependencies
- `@mdx-js/rollup` -- Vite-compatible MDX compiler
- `remark-frontmatter` -- Parse YAML frontmatter blocks
- `remark-mdx-frontmatter` -- Export frontmatter as a named export

### 2. Update `vite.config.ts`
- Import `mdx` from `@mdx-js/rollup` and both remark plugins
- Add `mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] })` to the plugins array (before `react()`)

### 3. Create `content/posts/` with 6 MDX files
Migrate each hardcoded post into its own `.mdx` file (e.g. `shift-handoff-best-practices.mdx`) with frontmatter matching the requested shape and placeholder body content (2-3 paragraphs of relevant manufacturing content per post).

### 4. Rewrite `src/pages/Blog.tsx`
- Use `import.meta.glob('/content/posts/*.mdx', { eager: true })` to load all posts at build time
- Extract frontmatter from each module's named `frontmatter` export
- Sort by `publishedDate` descending
- Keep all existing card UI, category filters, hero, CTA, and footer unchanged -- only swap data source
- Wrap each card title in a `<Link to={/blog/${slug}}>` so posts are clickable

### 5. Create `src/pages/BlogPost.tsx`
- Use `useParams()` to get `:slug`
- Use the same glob import to find the matching post by slug
- Render: MarketingNav, post header (title, date, author, category badge), MDX content via the default export component, back link, MarketingFooter
- Style MDX content with Tailwind prose classes (`prose prose-neutral dark:prose-invert`)

### 6. Add route in `src/App.tsx`
- Import `BlogPost` and add `<Route path="/blog/:slug" element={<BlogPost />} />` above the catch-all

### 7. Add MDX type declaration
- Create `src/types/mdx.d.ts` declaring the module `*.mdx` with `default` (React component) and `frontmatter` (record) exports

## Files

| File | Action |
|------|--------|
| `package.json` | Add 3 deps |
| `vite.config.ts` | Add MDX plugin |
| `src/types/mdx.d.ts` | New -- type declarations |
| `content/posts/*.mdx` (6 files) | New -- blog content |
| `src/pages/Blog.tsx` | Rewrite data source |
| `src/pages/BlogPost.tsx` | New -- individual post page |
| `src/App.tsx` | Add `/blog/:slug` route |

