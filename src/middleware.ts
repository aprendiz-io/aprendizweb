import { defineMiddleware } from "astro:middleware";
import {
	APEX_HOST,
	DEFAULT_LOCALE,
	isDevHost,
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	LOCALE_HOSTS,
	localeFromCountry,
	localeFromHost,
	type Locale,
	ROUTE_PAIRS,
	translatePath,
} from "./config/site";

const SKIP_PREFIXES = ["/_emdash", "/_astro", "/haqt6iy0yx2eNjg3Zjk0NjkzM2M1YjVhZTMzY2YxNmZl"];

function shouldSkip(pathname: string): boolean {
	if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return true;
	if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return true;
	return false;
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return null;
}

function resolvePreferredLocale(request: Request): Locale {
	const cookie = parseCookie(request.headers.get("cookie"), LOCALE_COOKIE);
	if (cookie === "es" || cookie === "en") return cookie;

	const country = request.headers.get("CF-IPCountry");
	return localeFromCountry(country ?? undefined);
}

function buildRedirectUrl(request: Request, targetHost: string, pathname: string): string {
	const url = new URL(request.url);
	url.hostname = targetHost;
	url.pathname = pathname;
	url.port = "";
	return url.toString();
}

function localePathGuard(pathname: string, hostLocale: Locale): string | null {
	for (const pair of ROUTE_PAIRS) {
		if (hostLocale === "en" && pathname === pair.es) return pair.en;
		if (hostLocale === "es" && pathname === pair.en) return pair.es;
	}
	return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { request, url } = context;
	const pathname = url.pathname;

	if (shouldSkip(pathname)) {
		return next();
	}

	const host = url.hostname;
	const dev = isDevHost(host);
	const hostLocale = localeFromHost(host) ?? DEFAULT_LOCALE;
	const preferred = resolvePreferredLocale(request);

	const correctedPath = localePathGuard(pathname, hostLocale);
	if (correctedPath) {
		return context.redirect(buildRedirectUrl(request, host, correctedPath), 301);
	}

	if (!dev) {
		if (host === APEX_HOST) {
			const targetHost = preferred === "en" ? LOCALE_HOSTS.en : LOCALE_HOSTS.es;
			const path = translatePath(pathname, hostLocale, preferred);
			return context.redirect(buildRedirectUrl(request, targetHost, path), 302);
		}

		const expectedHost = preferred === "en" ? LOCALE_HOSTS.en : LOCALE_HOSTS.es;
		if (host !== expectedHost && (host === LOCALE_HOSTS.es || host === LOCALE_HOSTS.en)) {
			const path = translatePath(pathname, hostLocale, preferred);
			return context.redirect(buildRedirectUrl(request, expectedHost, path), 302);
		}
	}

	const hasCookie = parseCookie(request.headers.get("cookie"), LOCALE_COOKIE);
	const response = await next();

	if (!hasCookie && (host === LOCALE_HOSTS.es || host === LOCALE_HOSTS.en || dev)) {
		const devCookie = `${LOCALE_COOKIE}=${hostLocale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
		const prodCookie = `${LOCALE_COOKIE}=${hostLocale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax; Domain=.aprendiz.io`;
		response.headers.append("Set-Cookie", dev ? devCookie : prodCookie);
	}

	return response;
});
