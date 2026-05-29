import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
// import { d1, r2, sandbox } from "@emdash-cms/cloudflare"; // Workers Paid: sandboxed plugins
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
  site: "https://www.aprendiz.io",
  output: "server",
  adapter: cloudflare(),
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
    domains: {
      es: "https://www.aprendiz.io",
      en: "https://en.aprendiz.io",
    },
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [formsPlugin(), webhookNotifier],
      // Workers Paid — sandboxed plugins + marketplace (move webhookNotifier to sandboxed):
      // sandboxed: [webhookNotifier],
      // sandboxRunner: sandbox(),
      // marketplace: "https://marketplace.emdashcms.com",
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: [400, 500, 600, 700],
      fallbacks: ["sans-serif"],
    },
  ],
  devToolbar: { enabled: false },
});
