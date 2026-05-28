---
name: emdash-cli
description: Use the EmDash CLI to manage content, schema, media, and more. Use this skill when you need to interact with a running EmDash instance from the command line — creating content, managing collections, uploading media, generating types, or scripting CMS operations.
---

# EmDash CLI

This project uses **pnpm 11**. Prefer `pnpm dev` and `pnpm types` when available; use `pnpm exec emdash <command>` for all other CLI invocations.

## Agent safety (deploy & remote)

- Routine work: local only (`pnpm dev`, `pnpm exec emdash types` against localhost).
- **Deploy:** never run `pnpm deploy` / `wrangler deploy` unless the user asked. When they do, confirm target + commands and wait for explicit approval before executing.
- **Remote CLI:** do not `emdash login --url <production>` or mutate remote content/schema unless the user explicitly requested it and confirmed the URL.

The EmDash CLI (`emdash` or `ec`) manages EmDash CMS instances. Commands fall into two categories:

- **Local commands** — work directly on a SQLite file, no running server needed: `init`, `dev`, `seed`, `export-seed`, `auth secret`
- **Remote commands** — talk to a running EmDash instance via HTTP: `types`, `login`, `logout`, `whoami`, `content`, `schema`, `media`, `search`, `taxonomy`, `menu`

## Authentication

Remote commands resolve auth automatically:

1. `--token` flag
2. `EMDASH_TOKEN` env var
3. Stored credentials from `emdash login`
4. Dev bypass (localhost only — no token needed)

For local dev servers, just run the command — auth is handled automatically. For remote instances, run `emdash login --url https://my-site.pages.dev` first.

## Custom Headers & Reverse Proxies

Sites behind Cloudflare Access or other reverse proxies need auth headers on every request. The CLI supports this via `--header` flags and environment variables.

### Service Tokens (Recommended for CI/Automation)

```bash
# Single header
pnpm exec emdash login --url https://my-site.pages.dev \
  --header "CF-Access-Client-Id: xxx.access" \
  --header "CF-Access-Client-Secret: yyy"

# Short form
pnpm exec emdash login -H "CF-Access-Client-Id: xxx" -H "CF-Access-Client-Secret: yyy"

# Via environment (newline-separated)
export EMDASH_HEADERS="CF-Access-Client-Id: xxx
CF-Access-Client-Secret: yyy"
pnpm exec emdash login --url https://my-site.pages.dev
```

Headers are persisted to `~/.config/emdash/auth.json` after login, so subsequent commands inherit them automatically.

### Cloudflare Access Browser Flow

If you don't have service tokens and `cloudflared` is installed, the CLI will automatically:

1. Detect when Access blocks the request
2. Try to get a cached JWT via `cloudflared access token`
3. Fall back to `cloudflared access login` for browser-based auth

This works for interactive use but isn't suitable for CI. Use service tokens for automation.

### Generic Reverse Proxy Auth

The `--header` flag works with any auth scheme:

```bash
# Basic auth
pnpm exec emdash login --url https://example.com -H "Authorization: Basic dXNlcjpwYXNz"

# Custom auth header
pnpm exec emdash login --url https://example.com -H "X-API-Key: secret123"
```

## Quick Reference

### Database Setup

Migrations and seed application happen automatically inside the runtime — there's no separate init/seed step. Just start the dev server (or deploy) and the first request runs pending migrations and applies the bundled seed if the database is empty.

```bash
# Start dev server (runs migrations, applies seed on empty DB, starts Astro)
pnpm exec emdash dev

# Start dev server and generate types from remote
pnpm exec emdash dev --types

# Export an existing database as a seed file
# (the runtime auto-discovers .emdash/seed.json on first boot;
# `mkdir -p` because the directory may not exist yet)
mkdir -p .emdash
pnpm exec emdash export-seed > .emdash/seed.json
pnpm exec emdash export-seed --with-content > .emdash/seed.json
```

### Type Generation

```bash
# Generate types from local dev server
pnpm exec emdash types

# Generate from remote
pnpm exec emdash types --url https://my-site.pages.dev

# Custom output path
pnpm exec emdash types --output src/types/cms.ts
```

Writes `.emdash/types.ts` (TypeScript interfaces) and `.emdash/schema.json`.

### Authentication

```bash
# Login (OAuth Device Flow)
pnpm exec emdash login --url https://my-site.pages.dev

# Check current user
pnpm exec emdash whoami

# Logout
pnpm exec emdash logout

# Generate auth secret for deployment
pnpm exec emdash auth secret
```

### Content CRUD

The CLI is designed for agents. Create and update auto-publish by default so agents get read-after-write consistency without managing drafts.

```bash
# List content
pnpm exec emdash content list posts
pnpm exec emdash content list posts --status published --limit 10

# Get a single item (Portable Text fields converted to markdown)
# Returns draft data if a pending draft exists
pnpm exec emdash content get posts 01ABC123
pnpm exec emdash content get posts 01ABC123 --raw        # skip PT->markdown conversion
pnpm exec emdash content get posts 01ABC123 --published   # ignore pending drafts

# Create content (auto-publishes by default)
pnpm exec emdash content create posts --data '{"title": "Hello", "body": "# World"}'
pnpm exec emdash content create posts --file post.json --slug hello-world
pnpm exec emdash content create posts --draft --data '...'  # keep as draft
cat post.json | pnpm exec emdash content create posts --stdin

# Update (requires --rev from a prior get, auto-publishes by default)
pnpm exec emdash content update posts 01ABC123 --rev MToyMDI2... --data '{"title": "Updated"}'
pnpm exec emdash content update posts 01ABC123 --rev MToyMDI2... --draft --data '...'  # keep as draft

# Delete (soft delete)
pnpm exec emdash content delete posts 01ABC123

# Lifecycle
pnpm exec emdash content publish posts 01ABC123
pnpm exec emdash content unpublish posts 01ABC123
pnpm exec emdash content schedule posts 01ABC123 --at 2026-03-01T09:00:00Z
pnpm exec emdash content restore posts 01ABC123
```

### Schema Management

```bash
# List collections
pnpm exec emdash schema list

# Get collection with fields
pnpm exec emdash schema get posts

# Create collection
pnpm exec emdash schema create articles --label Articles --description "Blog articles"

# Delete collection
pnpm exec emdash schema delete articles --force

# Add field
pnpm exec emdash schema add-field posts body --type portableText --label "Body Content"
pnpm exec emdash schema add-field posts featured --type boolean --required

# Remove field
pnpm exec emdash schema remove-field posts featured
```

Field types: `string`, `text`, `number`, `integer`, `boolean`, `datetime`, `select`, `multiSelect`, `image`, `file`, `reference`, `portableText`, `json`, `slug`, `url`. See `FIELD_TYPE_TO_COLUMN` in `packages/core/src/schema/types.ts` for the authoritative list.

### Media

```bash
# List media
pnpm exec emdash media list
pnpm exec emdash media list --mime image/png

# Upload
pnpm exec emdash media upload ./photo.jpg --alt "A sunset" --caption "Bristol, 2026"

# Get / delete
pnpm exec emdash media get 01MEDIA123
pnpm exec emdash media delete 01MEDIA123
```

### Search

```bash
pnpm exec emdash search "hello world"
pnpm exec emdash search "hello" --collection posts --limit 5
```

### Taxonomies

```bash
pnpm exec emdash taxonomy list
pnpm exec emdash taxonomy terms categories
pnpm exec emdash taxonomy add-term categories --name "Tech" --slug tech
pnpm exec emdash taxonomy add-term categories --name "Frontend" --parent 01PARENT123
```

### Menus

```bash
pnpm exec emdash menu list
pnpm exec emdash menu get primary
```

## Drafts and Publishing

The CLI auto-publishes on `create` and `update` by default. This means:

- **`create`** creates the item and immediately publishes it
- **`update`** updates the item and publishes if a draft revision was created
- **`get`** returns draft data if a pending draft exists (e.g. from the admin UI)

Use `--draft` on create/update to skip auto-publishing. Use `--published` on get to ignore pending drafts.

Collections that support revisions store edits as draft revisions. The CLI handles this transparently — agents don't need to know whether a collection uses revisions or not.

## JSON Output

All remote commands support `--json` for machine-readable output. It's auto-enabled when stdout is piped.

```bash
# Pipe to jq
pnpm exec emdash content list posts --json | jq '.items[].slug'

# Use in scripts
ID=$(pnpm exec emdash content create posts --data '{"title":"Hello"}' --json | jq -r '.id')
```

## Editing Flow

For details on how content editing works — Portable Text/markdown conversion, `_rev` tokens, and raw mode — see **[EDITING-FLOW.md](./EDITING-FLOW.md)**.
