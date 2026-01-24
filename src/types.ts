type Surveys = {
    [fingerprint: string]: number;
};

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
    surveys: Record<string, ReturnType<typeof Date.now>>;
};

export type { Surveys, Enhancement, VMSettings, Currencies };
