declare global {
	interface Window {
		// Google tag (gtag.js), defined once the visitor agrees to analytics or advertising (src/lib/analytics/tags.ts).
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		/** Which Google tags this page has configured. */
		__tmTags?: { ads: boolean; analytics: boolean; ga4MeasurementId?: string };
		/** Tawk live chat, loaded once the visitor agrees to it. */
		Tawk_API?: Record<string, unknown>;
		Tawk_LoadStart?: Date;
	}
}

export {};
