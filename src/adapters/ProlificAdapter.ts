import { BaseAdapter } from "./Adapter";
import { extractSymbol } from "../utils";

import type { AdapterSettings } from "./Adapter";

const PROLIFIC_SETTINGS: AdapterSettings = {
    enableInterval: false,
};

export class ProlificAdapter extends BaseAdapter {
    constructor(overrides: Partial<AdapterSettings> = {}) {
        super(PROLIFIC_SETTINGS, overrides);
    }

    getSurveyElements() {
        return document.querySelectorAll<HTMLElement>(
            'li[data-testid^="study-"]',
        );
    }

    getSurveyId(el: HTMLElement) {
        return el.getAttribute("data-testid")?.replace("study-", "") || null;
    }

    getSurveyContainer(el: HTMLElement) {
        return el.querySelector<HTMLElement>("div.study-content");
    }

    getInitCurrencyInfo(el: HTMLElement) {
        return extractSymbol(el.textContent) || null;
    }

    getCurrencyInfo(el: HTMLElement) {
        let displaySymbol = Array.from(el.classList).find((className) =>
            className.includes("current-"),
        );
        if (displaySymbol)
            displaySymbol = displaySymbol.replace("current-", "");
        let sourceSymbol = Array.from(el.classList).find((className) =>
            className.includes("source-"),
        );
        if (sourceSymbol) sourceSymbol = sourceSymbol.replace("source-", "");

        return {
            displaySymbol: displaySymbol || null,
            sourceSymbol: sourceSymbol || null,
        };
    }

    getRewardElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                "[data-testid='study-tag-reward-per-hour'], [data-testid='study-tag-reward']",
            ),
        );
    }

    getHourlyRateElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                "[data-testid='study-tag-reward-per-hour']",
            ),
        );
    }

    setHourlyRate(el: HTMLElement) {}
}
