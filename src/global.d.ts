declare global {
	interface Window {
		// Google tag (gtag.js), defined once the visitor agrees to analytics or advertising (src/lib/analytics/tags.ts).
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		/** Which Google tags this page has configured. */
		__tmTags?: { ads: boolean; analytics: boolean; ga4MeasurementId?: string };
	}
}

export {};
