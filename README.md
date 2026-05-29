# aprendiz web

Product landing and blog for [aprendiz](https://www.aprendiz.io), built with [EmDash](https://github.com/emdash-cms/emdash) on Astro and deployed on Cloudflare Workers.

## Locales

| Language | Production host |
| -------- | --------------- |
| Español  | `www.aprendiz.io` |
| English  | `en.aprendiz.io` |

- No `/es` or `/en` URL prefixes — language is determined by subdomain.
- First visit uses geo (`CF-IPCountry`) unless a `aprendiz_locale` cookie is set.
- Apex `aprendiz.io` redirects to the appropriate subdomain.

### Local development

```bash
pnpm install
pnpm dev
```

- Spanish (default): http://localhost:4321
- English: http://en.localhost:4321 (most systems resolve `*.localhost` to 127.0.0.1)

Admin: http://localhost:4321/_emdash/admin

## Pages

| Page | ES | EN |
| ---- | -- | -- |
| Home | `/` | `/` |
| Blog | `/blog` | `/blog` |
| Post | `/blog-posts/[slug]` | `/blog-posts/[slug]` |
| Contact | `/contacto` | `/contact` |
| Privacy | `/politica-privacidad` | `/privacy-policy` |
| Terms | `/terminos-y-condiciones` | `/terms-and-conditions` |

## Content

- **Landing & UI strings:** `src/i18n/es.ts`, `src/i18n/en.ts`
- **Blog posts & legal pages:** EmDash CMS (`seed/seed.json` + admin)
- **Static assets:** `public/images/aprendiz/`

## Commands

```bash
pnpm dev      # Dev server (migrations, seed, types)
pnpm build    # Production build
pnpm types    # Regenerate EmDash types
pnpm deploy   # Build + deploy to Cloudflare (confirm before running)
```
