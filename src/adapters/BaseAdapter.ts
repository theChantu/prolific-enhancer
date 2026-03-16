import { getDomainWithoutSuffix } from "tldts";
import { joinURL } from "ufo";

import type { ModuleName } from "./modules/BaseModule";

type UrlSettings = {
    host: string;
    path: string;
    iconPath: string;
    suffix?: string;
    query?: Record<string, string | number | boolean>;
};

// TODO: Allow AdapterSettings to inherit these settings based on whatever Module is extended
// e.g., CurrencyConversion would pass enableCurrencyConversion
// enableCurrencyConversion: boolean;
// enableHighlightRates: boolean;
// enableSurveyLinks: boolean;
// enableNewSurveyNotifications: boolean;
export type AdapterSettings = {
    enableAutoReload: boolean;
};

type CurrencyInfo = {
    displaySymbol: string | null;
    sourceSymbol: string | null;
};

export abstract class BaseAdapter {
    readonly url: Readonly<UrlSettings>;
    readonly siteName: string;
    readonly settings: Readonly<AdapterSettings>;
    abstract readonly modules: readonly ModuleName[];

    constructor(
        url: UrlSettings,
        defaults: AdapterSettings,
        overrides: Partial<AdapterSettings> = {},
    ) {
        this.url = url;
        this.siteName = getDomainWithoutSuffix(url.host) ?? url.host;
        this.settings = { ...defaults, ...overrides };
    }

    private _moduleSet?: ReadonlySet<ModuleName>;

    hasModule(module: ModuleName): boolean {
        this._moduleSet ??= new Set(this.modules);
        return this._moduleSet.has(module);
    }

    get origin(): string {
        return `https://${this.url.host}`;
    }

    buildUrl(segments: string[]) {
        return joinURL(this.origin, ...segments);
    }

    get iconUrl(): string {
        return this.buildUrl([this.url.iconPath]);
    }

    abstract getSurveyElements(): NodeListOf<HTMLElement>;
    abstract getSurveyId(el: HTMLElement): string | null;
    abstract getSurveyContainer(el: HTMLElement): HTMLElement | null;
    abstract getSurveyTitle(el: HTMLElement): HTMLElement | null;

    abstract getInitCurrencyInfo(el: HTMLElement): string | null;
    abstract getCurrencyInfo(el: HTMLElement): CurrencyInfo;

    abstract getCssSettings(): void;
    // TODO: Each adapter will return custom CSS which will be injected within main.ts
}
