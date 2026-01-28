type Enhancement = {
    apply(): void;
    revert(): void;
};

type Currencies = "USD" | "GBP";

type VMSettings = {
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
    enableDebug: boolean;
    surveys: Record<string, ReturnType<typeof Date.now>>;
    ui: {
        initialized?: boolean;
        hidden?: boolean;
        position?: { left: number; top: number };
    };
};

export type { Enhancement, VMSettings, Currencies };
