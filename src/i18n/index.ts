import type { Locale } from "../config/site";
import { localeFromHost } from "../config/site";
import { messages as en } from "./en";
import { messages as es } from "./es";

export type Messages = typeof es;

const catalog: Record<Locale, Messages> = { es, en };

export function getMessages(locale: Locale): Messages {
	return catalog[locale] ?? catalog.es;
}

export function getLocaleFromAstro(
	currentLocale: string | undefined,
	hostname?: string,
): Locale {
	const fromHost = hostname ? localeFromHost(hostname) : null;
	if (fromHost === "en") return "en";
	if (currentLocale === "en") return "en";
	return "es";
}
