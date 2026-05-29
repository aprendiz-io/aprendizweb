export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_COOKIE = "aprendiz_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Production hostnames per locale (also used for redirects). */
export const LOCALE_HOSTS: Record<Locale, string> = {
	es: "www.aprendiz.io",
	en: "en.aprendiz.io",
};

export const APEX_HOST = "aprendiz.io";

/** LATAM + Spain → Spanish on first visit. */
export const SPANISH_COUNTRIES = new Set([
	"ES",
	"AR",
	"CL",
	"CO",
	"MX",
	"PE",
	"VE",
	"EC",
	"UY",
	"PY",
	"BO",
	"CR",
	"PA",
	"GT",
	"HN",
	"SV",
	"NI",
	"DO",
	"PR",
]);

/** Static routes that differ by locale (path on each subdomain). */
export const ROUTE_PAIRS: { es: string; en: string }[] = [
	{ es: "/contacto", en: "/contact" },
	{ es: "/politica-privacidad", en: "/privacy-policy" },
	{ es: "/terminos-y-condiciones", en: "/terms-and-conditions" },
];

export function localeFromCountry(country: string | null | undefined): Locale {
	if (country && SPANISH_COUNTRIES.has(country.toUpperCase())) return "es";
	return "en";
}

export function hostForLocale(locale: Locale): string {
	return LOCALE_HOSTS[locale];
}

export function localeFromHost(host: string): Locale | null {
	const normalized = host.split(":")[0]?.toLowerCase() ?? "";
	if (normalized === LOCALE_HOSTS.es || normalized === "localhost") return "es";
	if (normalized === LOCALE_HOSTS.en || normalized === "en.localhost") return "en";
	if (normalized === APEX_HOST) return null;
	return null;
}

export function isDevHost(host: string): boolean {
	const h = host.split(":")[0]?.toLowerCase() ?? "";
	return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
}

/** Map a pathname from one locale to the equivalent on another subdomain. */
export function translatePath(pathname: string, from: Locale, to: Locale): string {
	if (from === to) return pathname;
	for (const pair of ROUTE_PAIRS) {
		if (from === "es" && pathname === pair.es) return pair.en;
		if (from === "en" && pathname === pair.en) return pair.es;
	}
	return pathname;
}

export function switchLocaleUrl(
	currentHost: string,
	pathname: string,
	currentLocale: Locale,
	targetLocale: Locale,
	protocol = "https",
): string {
	const path = translatePath(pathname, currentLocale, targetLocale);
	if (isDevHost(currentHost)) {
		return targetLocale === "en" ? `http://en.localhost:4321${path}` : `http://localhost:4321${path}`;
	}
	return `${protocol}://${hostForLocale(targetLocale)}${path}`;
}
