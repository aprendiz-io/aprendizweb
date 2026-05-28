import handler from "@astrojs/cloudflare/entrypoints/server";

// Workers Paid — uncomment with worker_loaders + sandbox config in wrangler.jsonc / astro.config.mjs:
// export { PluginBridge } from "@emdash-cms/cloudflare/sandbox";

export default handler;
