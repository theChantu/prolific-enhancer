type Enhancement = {
    apply(): void;
    revert(): void;
};

type Currencies = "USD" | "GBP";

interface SiteSettings {
    conversionRates: {
        timestamp: number;
        USD: { rates: Record<Currencies, number> };
        GBP: { rates: Record<Currencies, number> };
    };
    selectedCurrency: Currencies;
    enableCurrencyConversion: boolean;
    enableHighlightRates: boolean;
    enableSurveyLinks: boolean;
    enableNewSurveyNotifications: boolean;
    surveys: Record<string, ReturnType<typeof Date.now>>;
    ui: {
        initialized?: boolean;
        visible?: boolean;
        position?: { left: number; top: number };
    };
}

interface GlobalSettings {
    enableDebug: boolean;
}

export type { Enhancement, GlobalSettings, SiteSettings, Currencies };
