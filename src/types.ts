type Surveys = {
    [fingerprint: string]: number;
};

type Enhancement = {
    apply(): void;
    revert(): void;
};

type VMSettings = {
    rates: {
        timestamp: number;
        gbpToUsd: { rate: number };
        usdToGbp: { rate: number };
    };
    enableCurrencyConversion: boolean;
    enableHighlightRates: boolean;
    enableSurveyLinks: boolean;
    enableNewSurveyNotifications: boolean;
    initialized: boolean;
    surveys: Record<string, ReturnType<typeof Date.now>>;
    currency: Currency;
};

type Currency = "$" | "£";

export type { Surveys, Enhancement, VMSettings };
