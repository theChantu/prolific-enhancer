import { BaseAdapter } from "./BaseAdapter";
import { extractSymbol } from "../lib/utils";

import type { AdapterSettings } from "./BaseAdapter";
import type { ModuleName } from "./modules/BaseModule";

const PROLIFIC_SETTINGS: AdapterSettings = {
    enableAutoReload: false,
};

export class ProlificAdapter extends BaseAdapter {
    constructor(overrides: Partial<AdapterSettings> = {}) {
        super(
            {
                host: "app.prolific.com",
                path: "/studies",
                iconPath: "/apple-touch-icon.png",
            },
            PROLIFIC_SETTINGS,
            overrides,
        );
    }

    override modules: readonly ModuleName[] = [
        "CurrencyConversion",
        "HighlightRates",
        "NewSurveyNotifications",
        "SurveyLinks",
        "UI",
    ];

    getSurveyElements() {
        return document.querySelectorAll<HTMLElement>(
            'li[data-testid^="study-"]',
        );
    }

    getSurveyId(el: HTMLElement) {
        return el.getAttribute("data-testid")?.replace("study-", "") ?? null;
    }

    getSurveyContainer(el: HTMLElement) {
        return el.querySelector<HTMLElement>("div.study-content");
    }

    getSurveyTitle(el: HTMLElement) {
        return el.querySelector<HTMLElement>("h2") ?? null;
    }

    getInitCurrencyInfo(el: HTMLElement) {
        return extractSymbol(el.textContent) ?? null;
    }

    getCurrencyInfo(el: HTMLElement) {
        let displayClass = Array.from(el.classList).find((className) =>
            className.startsWith("display-"),
        );

        let sourceClass = Array.from(el.classList).find((className) =>
            className.startsWith("source-"),
        );

        const displaySymbol = displayClass?.replace("display-", "");
        const sourceSymbol = sourceClass?.replace("source-", "");

        return {
            displaySymbol:
                displaySymbol ?? this.getInitCurrencyInfo(el) ?? null,
            sourceSymbol: sourceSymbol ?? this.getInitCurrencyInfo(el) ?? null,
        };
    }

    getRewardElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                "[data-testid='study-tag-reward-per-hour'], [data-testid='study-tag-reward']",
            ),
        );
    }

    getRewardElement(el: HTMLElement) {
        return (
            el.querySelector<HTMLElement>("[data-testid='study-tag-reward']") ??
            null
        );
    }

    getHourlyRateElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                "[data-testid='study-tag-reward-per-hour']",
            ),
        );
    }

    getHourlyRateElement(el: HTMLElement) {
        return (
            el.querySelector<HTMLElement>(
                "[data-testid='study-tag-reward-per-hour']",
            ) ?? null
        );
    }

    setHourlyRate(el: HTMLElement) {}
}
