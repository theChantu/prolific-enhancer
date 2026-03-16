import type { SiteSettings } from "../lib/types";

// TODO: Have a fallback rate of 1 for each conversion rate
// Instead of storing USD: 1, GBP: 1 and etc, initialize automatically with fetchedRate ?? 1, if fetch fails
const defaultSiteSettings = Object.freeze({
    conversionRates: {
        timestamp: 0,
        USD: { rates: { GBP: 0.74, USD: 1 } },
        GBP: { rates: { USD: 1.35, GBP: 1 } },
    },
    selectedCurrency: "USD",
    enableCurrencyConversion: true,
    enableHighlightRates: true,
    enableSurveyLinks: true,
    enableNewSurveyNotifications: true,
    surveys: {},
    ui: { initialized: false, visible: true, position: { left: 0, top: 0 } },
}) satisfies SiteSettings;

export { defaultSiteSettings };
