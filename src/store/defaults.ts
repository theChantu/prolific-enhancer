import type { VMSettings } from "../types";

const defaultVMSettings = Object.freeze({
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
}) satisfies VMSettings;

export { defaultVMSettings };
