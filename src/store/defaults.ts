import type { VMSettings } from "../types";

const defaultVMSettings = Object.freeze({
    rates: {
        timestamp: 0,
        gbpToUsd: { rate: 1.35 },
        usdToGbp: { rate: 0.74 },
    },
    enableCurrencyConversion: true,
    enableHighlightRates: true,
    enableSurveyLinks: true,
    enableNewSurveyNotifications: true,
    initialized: false,
    surveys: {},
    currency: "$",
}) satisfies VMSettings;

export { defaultVMSettings };
